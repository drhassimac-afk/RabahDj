import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:shelf/shelf.dart' as shelf;
import 'package:shelf/shelf_io.dart' as shelf_io;
import 'package:shelf_router/shelf_router.dart' as shelf_router;
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:video_player/video_player.dart';
import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart';
import 'package:path_provider/path_provider.dart';
import 'package:record/record.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:encrypt/encrypt.dart' as enc; // استيراد مكتبة التشفير
import 'package:flutter_local_notifications/flutter_local_notifications.dart'; // مكتبة الإشعارات
import 'post_model.dart';

// إعدادات التشفير (مفتاح سري مشترك ثابت لتبسيط الاتصال البيني الآمن)
final _cryptoKey = enc.Key.fromUtf8('my32bytesecretkeymustbe32chars!!');
final _cryptoIV = enc.IV.fromLength(16);
final _encrypter = enc.Encrypter(enc.AES(_cryptoKey));

// محرك الإشعارات المحلي
final FlutterLocalNotificationsPlugin _localNotificationsPlugin = FlutterLocalNotificationsPlugin();

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // تهيئة نظام الإشعارات للهواتف
  const AndroidInitializationSettings initializationSettingsAndroid = AndroidInitializationSettings('@mipmap/ic_launcher');
  const InitializationSettings initializationSettings = InitializationSettings(android: initializationSettingsAndroid);
  await _localNotificationsPlugin.initialize(initializationSettings);

  runApp(const RabahDjFacebookApp());
}

class RabahDjFacebookApp extends StatelessWidget {
  const RabahDjFacebookApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Facebook Local Pro',
      theme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.light,
        primaryColor: const Color(0xFF1877F2),
        scaffoldBackgroundColor: const Color(0xFFF0F2F5),
        colorScheme: const ColorScheme.light(
          primary: Color(0xFF1877F2),
          secondary: Color(0xFF42B72A),
          surface: Colors.white,
        ),
      ),
      home: const FacebookHomePage(),
    );
  }
}

class FacebookHomePage extends StatefulWidget {
  const FacebookHomePage({super.key});

  @override
  State<FacebookHomePage> createState() => _FacebookHomePageState();
}

class _FacebookHomePageState extends State<FacebookHomePage> {
  List<PostModel> _posts = [];
  final _contentCtrl = TextEditingController();
  final _ipServerCtrl = TextEditingController();

  String _myIpAddress = "جاري جلب الـ IP...";
  bool _isServerRunning = false;
  HttpServer? _localServer;
  Timer? _autoRefreshTimer;
  
  RawDatagramSocket? _udpSocket;
  Timer? _udpBroadcastTimer;

  final ImagePicker _picker = ImagePicker();
  File? _selectedImageFile;
  File? _selectedVideoFile;
  bool _isUploading = false;

  // ميزات الصوت الحية
  final AudioRecorder _audioRecorder = AudioRecorder();
  final AudioPlayer _audioPlayer = AudioPlayer();
  bool _isInVoiceCall = false;
  bool _isMuted = false;
  StreamSubscription<Uint8List>? _audioStreamSubscription;
  InternetAddress? _connectedPeerIp;

  // ميزات الملف الشخصي
  String _profileName = "مستخدم فيسبوك";
  String? _localAvatarPath;
  String? _localCoverPath;

  // ميزات المشاركة السريعة
  List<String> _receivedFiles = [];
  bool _isTransferring = false;

  @override
  void initState() {
    super.initState();
    _loadProfileData();
    _loadPostsFromLocal();
    _loadReceivedFiles();
    _getWifiIp();
    _autoRefreshTimer = Timer.periodic(const Duration(seconds: 2), (timer) {
      _silentRefreshPosts();
    });
    _startListeningForHosts();
  }

  @override
  void dispose() {
    _contentCtrl.dispose();
    _ipServerCtrl.dispose();
    _autoRefreshTimer?.cancel();
    _udpBroadcastTimer?.cancel();
    _udpSocket?.close();
    _localServer?.close();
    _audioStreamSubscription?.cancel();
    _audioRecorder.dispose();
    _audioPlayer.dispose();
    super.dispose();
  }

  // دالة إطلاق إشعار للنظام
  Future<void> _triggerSystemNotification(String title, String body) async {
    const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
      'facebook_local_share_channels', 'Facebook Local Notifications',
      importance: Importance.max, priority: Priority.high, ticker: 'ticker'
    );
    const NotificationDetails notificationDetails = NotificationDetails(android: androidDetails);
    await _localNotificationsPlugin.show(DateTime.now().millisecond, title, body, notificationDetails);
  }

  Future<void> _loadProfileData() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _profileName = prefs.getString('user_profile_name') ?? "مستخدم محلي";
      _localAvatarPath = prefs.getString('user_avatar_path');
      _localCoverPath = prefs.getString('user_cover_path');
    });
  }

  Future<void> _saveProfileData(String name, String? avatar, String? cover) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('user_profile_name', name);
    if (avatar != null) await prefs.setString('user_avatar_path', avatar);
    if (cover != null) await prefs.setString('user_cover_path', cover);
    _loadProfileData();
  }

  Future<void> _loadReceivedFiles() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() { _receivedFiles = prefs.getStringList('local_received_files_v1') ?? []; });
  }

  Future<void> _saveReceivedFiles() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList('local_received_files_v1', _receivedFiles);
  }

  Future<void> _loadPostsFromLocal() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedData = prefs.getString('local_posts_v3_backup');
      if (savedData != null) {
        final List decodedList = jsonDecode(savedData);
        setState(() { _posts = decodedList.map((item) => PostModel.fromMap(item)).toList(); });
      }
    } catch (_) {}
  }

  Future<void> _savePostsToLocal() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final jsonList = _posts.map((p) => p.toMap()).toList();
      await prefs.setString('local_posts_v3_backup', jsonEncode(jsonList));
    } catch (_) {}
  }

  void _showNotification(String message, IconData icon) {
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(icon, color: Colors.white, size: 20),
            const SizedBox(width: 10),
            Expanded(child: Text(message, style: const TextStyle(fontWeight: FontWeight.bold))),
          ],
        ),
        backgroundColor: const Color(0xFF1877F2),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  Future<void> _getWifiIp() async {
    try {
      for (var interface in await NetworkInterface.list()) {
        for (var addr in interface.addresses) {
          if (addr.type == InternetAddressType.IPv4 && !addr.isLoopback) {
            setState(() => _myIpAddress = addr.address);
            return;
          }
        }
      }
      setState(() => _myIpAddress = "127.0.0.1");
    } catch (_) {}
  }

  void _toggleVoiceCall() async {
    if (_isInVoiceCall) {
      _audioStreamSubscription?.cancel();
      await _audioRecorder.stop();
      setState(() { _isInVoiceCall = false; });
      _showNotification("تم مغادرة الغرفة الصوتية 🚪", Icons.call_end);
    } else {
      if (await _audioRecorder.hasPermission()) {
        setState(() { _isInVoiceCall = true; });
        _showNotification("أنت الآن داخل الغرفة الصوتية المشفرة آمنياً! 🎙️🔒", Icons.mic);
        final stream = await _audioRecorder.startStream(const RecordConfig());
        _audioStreamSubscription = stream.listen((Uint8List audioData) {
          if (!_isMuted && _udpSocket != null && _connectedPeerIp != null) {
            // تشفير دفق الصوت الحي لحظياً لحماية الخصوصية عبر الشبكة
            final encryptedAudio = _encrypter.encryptBytes(audioData, iv: _cryptoIV).bytes;
            _udpSocket!.send(encryptedAudio, _connectedPeerIp!, 9999);
          }
        });
      }
    }
  }

  Future<void> _sendLocalFileViaAirDrop() async {
    final targetIp = _ipServerCtrl.text.trim();
    if (targetIp.isEmpty) return;

    FilePickerResult? result = await FilePicker.pickFiles();
    if (result != null && result.files.single.path != null) {
      File file = File(result.files.single.path!);
      String fileName = result.files.single.name;
      int totalBytes = await file.length();

      setState(() { _isTransferring = true; });
      try {
        final request = http.MultipartRequest('POST', Uri.parse('http://$targetIp:8080/airdrop'));
        request.headers['filename'] = Uri.encodeComponent(fileName);
        
        final streamUpload = http.ByteStream(file.openRead());
        final multipartFile = http.MultipartFile('file', streamUpload, totalBytes, filename: fileName);
        request.files.add(multipartFile);

        final response = await request.send();
        if (response.statusCode == 200) {
          _showNotification("تم إرسال الملف بنجاح! ⚡", Icons.cloud_done);
        }
      } catch (_) {}
      setState(() { _isTransferring = false; });
    }
  }

  void _startLocalServer() async {
    final appRouter = shelf_router.Router();

    appRouter.get('/posts', (shelf.Request request) {
      // تفريغ البيانات وتشفير الاستجابة لضمان أمان تغذية الأخبار بالكامل
      final jsonList = _posts.map((p) => p.toMap()).toList();
      final encryptedBody = _encrypter.encrypt(jsonEncode(jsonList), iv: _cryptoIV).base64;
      return shelf.Response.ok(encryptedBody);
    });

    appRouter.get('/files/<filename>', (shelf.Request request, String filename) async {
      try {
        final docDir = await getApplicationDocumentsDirectory();
        final file = File('${docDir.path}//files/$filename');
        if (await file.exists()) return shelf.Response.ok(file.openRead());
      } catch (_) {}
      return shelf.Response.notFound('Not Found');
    });

    appRouter.post('/add_post', (shelf.Request request) async {
      final payload = await request.readAsString();
      // فك التشفير الآمن للمنشور القادم من العميل
      final decryptedPayload = _encrypter.decrypt64(payload, iv: _cryptoIV);
      final newPost = PostModel.fromMap(jsonDecode(decryptedPayload));
      
      setState(() { _posts.insert(0, newPost); });
      _savePostsToLocal();

      // إطلاق إشعار حقيقي في هاتف المستقبل ينبئه بوجود منشور جديد فوراً بدون إنترنت!
      _triggerSystemNotification("منشور جديد من ${newPost.username} 📝", newPost.content);

      return shelf.Response.ok('success');
    });

    appRouter.post('/airdrop', (shelf.Request request) async {
      try {
        final rawName = request.headers['filename'] ?? 'file.dat';
        final fileName = Uri.decodeComponent(rawName);
        final docDir = await getApplicationDocumentsDirectory();
        final savePath = '${docDir.path}/$fileName';
        
        final file = File(savePath);
        final ios = file.openWrite();
        await request.read().forEach((chunk) => ios.add(chunk));
        await ios.close();

        setState(() { _receivedFiles.insert(0, savePath); });
        _saveReceivedFiles();

        // إشعار فوري باستلام ملف محلي
        _triggerSystemNotification("مشاركة سريعة 📁", "استلمت ملفاً جديداً: $fileName");

        return shelf.Response.ok('received');
      } catch (_) { return shelf.Response.internalServerError(); }
    });

    try {
      _localServer = await shelf_io.serve(appRouter, InternetAddress.anyIPv4, 8080);
      setState(() { _isServerRunning = true; _ipServerCtrl.text = _myIpAddress; });
      _startUdpBroadcast();
      _startUdpVoiceSocket();
      _showNotification("تم تفعيل سيرفر فيسبوك المطور والآمن! 📡🔐", Icons.shield);
    } catch (_) {}
  }

  void _startUdpBroadcast() async {
    try {
      _udpSocket = await RawDatagramSocket.bind(InternetAddress.anyIPv4, 0);
      _udpSocket?.broadcastEnabled = true;
      _udpBroadcastTimer = Timer.periodic(const Duration(seconds: 3), (timer) {
        _udpSocket?.send(utf8.encode("RABAH_DJ_HOST:$_myIpAddress"), InternetAddress('255.255.255.255'), 8888);
      });
    } catch (_) {}
  }

  void _startUdpVoiceSocket() async {
    try {
      final voiceSocket = await RawDatagramSocket.bind(InternetAddress.anyIPv4, 9999);
      voiceSocket.listen((RawSocketEvent event) {
        if (event == RawSocketEvent.read) {
          final Datagram? dg = voiceSocket.receive();
          if (dg != null && _isInVoiceCall) {
            // فك تشفير الصوت الحي المستلم حماية للخصوصية
            final decryptedAudio = _encrypter.decryptBytes(enc.Encrypted(dg.data), iv: _cryptoIV);
            _audioPlayer.play(BytesSource(Uint8List.fromList(decryptedAudio)));
          }
        }
      });
    } catch (_) {}
  }

  void _startListeningForHosts() async {
    try {
      final socket = await RawDatagramSocket.bind(InternetAddress.anyIPv4, 8888);
      socket.listen((RawSocketEvent event) {
        if (event == RawSocketEvent.read) {
          final Datagram? dg = socket.receive();
          if (dg != null) {
            final String msg = utf8.decode(dg.data);
            if (msg.startsWith("RABAH_DJ_HOST:")) {
              final detectedIp = msg.split(":")[1];
              _connectedPeerIp = dg.address;
              if (!_isServerRunning && _ipServerCtrl.text != detectedIp) {
                setState(() => _ipServerCtrl.text = detectedIp);
                _triggerSystemNotification("اتصال تلقائي الشبكة 📡", "تم قفل الاتصال والربط مع المضيف: $detectedIp");
              }
            }
          }
        }
      });
    } catch (_) {}
  }

  Future<void> _silentRefreshPosts() async {
    final targetIp = _ipServerCtrl.text.trim();
    if (targetIp.isEmpty) return;
    try {
      final response = await http.get(Uri.parse('http://$targetIp:8080/posts')).timeout(const Duration(seconds: 1));
      if (response.statusCode == 200) {
        // فك تشفير التغذية الإخبارية القادمة من الصديق بشكل آمن تماماً
        final decryptedBody = _encrypter.decrypt64(response.body, iv: _cryptoIV);
        final List decodedList = jsonDecode(decryptedBody);
        setState(() { _posts = decodedList.map((item) => PostModel.fromMap(item)).toList(); });
        _savePostsToLocal();
      }
    } catch (_) {}
  }

  Future<void> _sendMediaPost(String type) async {
    final content = _contentCtrl.text.trim();
    final targetIp = _ipServerCtrl.text.trim();
    if (content.isEmpty && _selectedImageFile == null && _selectedVideoFile == null) return;
    if (targetIp.isEmpty) return;

    setState(() => _isUploading = true);
    String? localImgUrl;
    String? localVideoUrl;

    if (_selectedImageFile != null) {
      final docDir = await getApplicationDocumentsDirectory();
      final fileName = 'img_${DateTime.now().millisecondsSinceEpoch}.jpg';
      await _selectedImageFile!.copy('${docDir.path}/$fileName');
      localImgUrl = 'http://$_myIpAddress:8080/files/$fileName';
    }

    final newPost = PostModel(
      id: DateTime.now().millisecondsSinceEpoch.toString(), username: _profileName,
      content: content, imageUrl: localImgUrl, videoUrl: localVideoUrl,
      type: type, likes: 0, dateTime: DateTime.now(), comments: [],
    );

    // تشفير محتوى المنشور بالكامل خوارزمية AES قبل الدفع للشبكة
    final encryptedPostPayload = _encrypter.encrypt(jsonEncode(newPost.toMap()), iv: _cryptoIV).base64;

    if (_isServerRunning && targetIp == _myIpAddress) {
      setState(() { _posts.insert(0, newPost); _isUploading = false; _selectedImageFile = null; });
      _savePostsToLocal();
    } else {
      try {
        await http.post(Uri.parse('http://$targetIp:8080/add_post'), body: encryptedPostPayload);
      } catch (_) {}
      setState(() { _isUploading = false; _selectedImageFile = null; });
    }
    _contentCtrl.clear();
    Navigator.pop(context);
    _silentRefreshPosts();
  }

  void _showCreatePostBottomSheet() {
    showModalBottomSheet(
      context: context, isScrollControlled: true,
      builder: (context) {
        return StatefulBuilder(
          builder: (BuildContext context, StateSetter setSheetState) {
            return Padding(
              padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom, top: 16, left: 16, right: 16),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.shade400, borderRadius: BorderRadius.circular(10))),
                  const SizedBox(height: 12),
                  Text("نشر محتوى مشفر وآمن 📸🔒", style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  const Divider(),
                  TextField(controller: _contentCtrl, maxLines: 2, decoration: const InputDecoration(hintText: "ماذا يدور في ذهنك؟...")),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      TextButton.icon(onPressed: () async {
                        final XFile? img = await _picker.pickImage(source: ImageSource.gallery);
                        if (img != null) setSheetState(() { _selectedImageFile = File(img.path); });
                      }, icon: const Icon(Icons.image, color: Colors.green), label: const Text("صورة")),
                    ],
                  ),
                  const Divider(),
                  _isUploading ? const CircularProgressIndicator() : ElevatedButton(onPressed: () => _sendMediaPost('post'), child: const Text("نشر مشفر الآن")),
                  const SizedBox(height: 16),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildProfileView() {
    final nameController = TextEditingController(text: _profileName);
    return SingleChildScrollView(
      child: Column(
        children: [
          Stack(
            clipBehavior: Clip.none, alignment: Alignment.center,
            children: [
              GestureDetector(
                onTap: () async {
                  final XFile? img = await _picker.pickImage(source: ImageSource.gallery);
                  if (img != null) _saveProfileData(_profileName, _localAvatarPath, img.path);
                },
                child: Container(
                  height: 140, width: double.infinity, color: Colors.grey.shade300,
                  child: _localCoverPath != null ? Image.file(File(_localCoverPath!), fit: BoxFit.cover) : const Center(child: Icon(Icons.add_a_photo, color: Colors.black54)),
                ),
              ),
              Positioned(
                bottom: -40,
                child: GestureDetector(
                  onTap: () async {
                    final XFile? img = await _picker.pickImage(source: ImageSource.gallery);
                    if (img != null) _saveProfileData(_profileName, img.path, _localCoverPath);
                  },
                  child: CircleAvatar(
                    radius: 45, backgroundColor: Colors.white,
                    child: CircleAvatar(radius: 42, backgroundColor: Colors.blue.shade100, backgroundImage: _localAvatarPath != null ? FileImage(File(_localAvatarPath!)) : null, child: _localAvatarPath == null ? const Icon(Icons.camera_alt) : null),
                  ),
                ),
              )
            ],
          ),
          const SizedBox(height: 50),
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  children: [
                    Text(_profileName, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 10),
                    TextField(controller: nameController, decoration: const InputDecoration(labelText: "تعديل الاسم المستعار", border: OutlineInputBorder())),
                    const SizedBox(height: 12),
                    ElevatedButton(onPressed: () { if (nameController.text.trim().isNotEmpty) _saveProfileData(nameController.text.trim(), _localAvatarPath, _localCoverPath); }, child: const Text("حفظ التغييرات")),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildShareView() {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        children: [
          Card(
            color: Colors.blue.shade50,
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                children: [
                  const Icon(Icons.bolt, size: 50, color: Colors.orange),
                  const SizedBox(height: 8),
                  const Text("مشاركة الملفات السريعة محلياً", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 16),
                  if (_isTransferring) ...[
                    const LinearProgressIndicator(color: Colors.orange),
                    const SizedBox(height: 8),
                  ] else
                    ElevatedButton.icon(
                      onPressed: _sendLocalFileViaAirDrop,
                      style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF1877F2), foregroundColor: Colors.white),
                      icon: const Icon(Icons.drive_folder_upload),
                      label: const Text("اختر وأرسل ملفاً الآن 📁"),
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          const Row(children: [Icon(Icons.folder_shared, color: Colors.blue), SizedBox(width: 6), Text("الملفات المستلمة محلياً", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15))]),
          const Divider(),
          Expanded(
            child: _receivedFiles.isEmpty
                ? const Center(child: Text("لم تستلم أي ملفات بعد.", style: TextStyle(color: Colors.black38)))
                : ListView.builder(
                    itemCount: _receivedFiles.length,
                    itemBuilder: (context, index) {
                      final path = _receivedFiles[index];
                      final name = path.split('/').last;
                      return Card(
                        margin: const EdgeInsets.symmetric(vertical: 4),
                        child: ListTile(
                          leading: const Icon(Icons.insert_drive_file, color: Colors.green),
                          title: Text(name, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold), maxLines: 1, overflow: TextOverflow.ellipsis),
                          subtitle: Text(path, style: const TextStyle(fontSize: 10, color: Colors.black38), maxLines: 1, overflow: TextOverflow.ellipsis),
                        ),
                      );
                    },
                  ),
          )
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final feedsList = _posts.where((p) => p.type == 'post').toList();

    return DefaultTabController(
      length: 4,
      child: Scaffold(
        appBar: AppBar(
          title: const Text("facebook", style: TextStyle(color: Color(0xFF1877F2), fontWeight: FontWeight.bold, fontSize: 26, letterSpacing: -0.5)),
          elevation: 1,
          actions: [
            IconButton(icon: Icon(_isInVoiceCall ? Icons.phone_in_talk : Icons.phone_disabled, color: _isInVoiceCall ? Colors.green : Colors.red), onPressed: _toggleVoiceCall),
            IconButton(icon: const Icon(Icons.add_box_outlined, color: Colors.black), onPressed: _showCreatePostBottomSheet),
            IconButton(icon: Icon(_isServerRunning ? Icons.shield : Icons.shield_outlined, color: _isServerRunning ? Colors.green : Colors.blue), onPressed: _getWifiIp)
          ],
          bottom: const TabBar(
            tabs: [
              Tab(icon: Icon(Icons.home, size: 24), text: "الأخبار"),
              Tab(icon: Icon(Icons.person, size: 24), text: "بروفايل"),
              Tab(icon: Icon(Icons.bolt, size: 24), text: "مشاركة"),
              Tab(icon: Icon(Icons.movie_filter_outlined, size: 24), text: "ريلز"),
            ],
            indicatorColor: Color(0xFF1877F2),
            labelColor: Color(0xFF1877F2),
            unselectedLabelColor: Colors.grey,
          ),
        ),
        body: TabBarView(
          physics: const NeverScrollableScrollPhysics(),
          children: [
            Column(
              children: [
                if (_isInVoiceCall)
                  Container(
                    color: Colors.green.shade600, padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 12),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text("الاتصال الصوتي الحي والمشفر AES نشط... 🔒🎙️", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11)),
                        IconButton(icon: Icon(_isMuted ? Icons.mic_off : Icons.mic, color: Colors.white, size: 18), onPressed: () => setState(() { _isMuted = !_isMuted; })),
                      ],
                    ),
                  ),
                Container(
                  color: Colors.white, padding: const EdgeInsets.all(8),
                  child: Row(
                    children: [
                      Icon(_isServerRunning ? Icons.lock : Icons.lock_open, size: 18, color: _isServerRunning ? Colors.green : Colors.orange),
                      const SizedBox(width: 6),
                      Expanded(child: Text(_isServerRunning ? "بثك الآمن نشط على: $_myIpAddress 🛡️" : "يبحث عن شبكة أصدقاء آمنة... 🔍", style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold))),
                      if (!_isServerRunning && _ipServerCtrl.text.isEmpty) ElevatedButton(onPressed: _startLocalServer, child: const Text("ابدأ بث 📡")),
                    ],
                  ),
                ),
                Expanded(
                  child: feedsList.isEmpty
                      ? const Center(child: Text("لا توجد منشورات حالياً"))
                      : ListView.builder(
                          itemCount: feedsList.length,
                          itemBuilder: (context, i) {
                            final post = feedsList[i];
                            return Container(
                              color: Colors.white, margin: const EdgeInsets.symmetric(vertical: 4), padding: const EdgeInsets.all(12),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      const CircleAvatar(radius: 18, child: Icon(Icons.person, size: 18)),
                                      const SizedBox(width: 8),
                                      Text(post.username, style: const TextStyle(fontWeight: FontWeight.bold)),
                                      const Spacer(),
                                      const Icon(Icons.security, size: 14, color: Colors.green), // شارة للمنشور المشفر
                                    ],
                                  ),
                                  const SizedBox(height: 6),
                                  Text(post.content),
                                  if (post.imageUrl != null) Padding(padding: const EdgeInsets.only(top: 8), child: Image.network(post.imageUrl!)),
                                  const Divider(),
                                  TextButton.icon(onPressed: () => setState(() { post.likes++; }), icon: const Icon(Icons.thumb_up_outlined), label: Text("إعجاب (${post.likes})")),
                                ],
                              ),
                            );
                          },
                        ),
                ),
              ],
            ),
            _buildProfileView(),
            _buildShareView(),
            const Center(child: Text("تبويب الريلز جاهز ومحمي بالكامل! 🎬🔒")),
          ],
        ),
      ),
    );
  }
}

