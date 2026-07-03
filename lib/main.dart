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
import 'package:path_provider/path_provider.dart';
import 'package:record/record.dart';
import 'package:audioplayers/audioplayers.dart';
import 'post_model.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
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
  final _usernameCtrl = TextEditingController();
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

  // متغيرات ميزة الملف الشخصي (Profile)
  String _profileName = "مستخدم فيسبوك";
  String? _localAvatarPath;
  String? _localCoverPath;

  @override
  void initState() {
    super.initState();
    _loadProfileData();
    _loadPostsFromLocal();
    _getWifiIp();
    _autoRefreshTimer = Timer.periodic(const Duration(seconds: 2), (timer) {
      _silentRefreshPosts();
    });
    _startListeningForHosts();
  }

  @override
  void dispose() {
    _usernameCtrl.dispose();
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

  // تحميل بيانات البروفايل محلياً
  Future<void> _loadProfileData() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _profileName = prefs.getString('user_profile_name') ?? "مستخدم محلي";
      _usernameCtrl.text = _profileName;
      _localAvatarPath = prefs.getString('user_avatar_path');
      _localCoverPath = prefs.getString('user_cover_path');
    });
  }

  // حفظ بيانات البروفايل
  Future<void> _saveProfileData(String name, String? avatar, String? cover) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('user_profile_name', name);
    if (avatar != null) await prefs.setString('user_avatar_path', avatar);
    if (cover != null) await prefs.setString('user_cover_path', cover);
    _loadProfileData();
  }

  Future<void> _loadPostsFromLocal() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedData = prefs.getString('local_posts_v3_backup');
      if (savedData != null) {
        final List decodedList = jsonDecode(savedData);
        setState(() {
          _posts = decodedList.map((item) => PostModel.fromMap(item)).toList();
        });
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
        duration: const Duration(seconds: 3),
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

  // التقاط وتدفق الوسائط من المعرض لحساب البروفايل أو المنشورات
  Future<String?> _saveFileToDocs(File file, String prefix) async {
    final docDir = await getApplicationDocumentsDirectory();
    final fileName = '${prefix}_${DateTime.now().millisecondsSinceEpoch}.jpg';
    final savedFile = await file.copy('${docDir.path}/$fileName');
    return savedFile.path;
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
        _showNotification("أنت الآن داخل الغرفة الصوتية الحية! 🎙️", Icons.mic);
        final stream = await _audioRecorder.startStream(const RecordConfig());
        _audioStreamSubscription = stream.listen((Uint8List audioData) {
          if (!_isMuted && _udpSocket != null && _connectedPeerIp != null) {
            _udpSocket!.send(audioData, _connectedPeerIp!, 9999);
          }
        });
      }
    }
  }

  void _startLocalServer() async {
    final appRouter = shelf_router.Router();

    appRouter.get('/posts', (shelf.Request request) {
      final jsonList = _posts.map((p) => p.toMap()).toList();
      return shelf.Response.ok(jsonEncode(jsonList), headers: {'Content-Type': 'application/json; charset=utf-8'});
    });

    appRouter.get('/files/<filename>', (shelf.Request request, String filename) async {
      try {
        final docDir = await getApplicationDocumentsDirectory();
        final file = File('${docDir.path}/$filename');
        if (await file.exists()) {
          return shelf.Response.ok(file.openRead(), headers: {
            'Content-Type': filename.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg',
          });
        }
      } catch (_) {}
      return shelf.Response.notFound('File not found');
    });

    appRouter.post('/add_post', (shelf.Request request) async {
      final payload = await request.readAsString();
      final newPost = PostModel.fromMap(jsonDecode(payload));
      setState(() { _posts.insert(0, newPost); });
      _savePostsToLocal();
      return shelf.Response.ok(jsonEncode({'status': 'success'}));
    });

    try {
      _localServer = await shelf_io.serve(appRouter, InternetAddress.anyIPv4, 8080);
      setState(() { _isServerRunning = true; _ipServerCtrl.text = _myIpAddress; });
      _startUdpBroadcast();
      _startUdpVoiceSocket();
      _showNotification("تم تفعيل سيرفر فيسبوك المطور بنجاح! 📡", Icons.router);
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
            _audioPlayer.play(BytesSource(dg.data));
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
                _showNotification("متصل تلقائياً بشبكة صديقك: $detectedIp ⚡", Icons.wifi_lock);
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
        final List decodedList = jsonDecode(utf8.decode(response.bodyBytes));
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
      final path = await _saveFileToDocs(_selectedImageFile!, 'img');
      localImgUrl = 'http://$_myIpAddress:8080/files/${path!.split('/').last}';
    }
    if (_selectedVideoFile != null) {
      final docDir = await getApplicationDocumentsDirectory();
      final fileName = 'vid_${DateTime.now().millisecondsSinceEpoch}.mp4';
      await _selectedVideoFile!.copy('${docDir.path}/$fileName');
      localVideoUrl = 'http://$_myIpAddress:8080/files/$fileName';
    }

    final newPost = PostModel(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      username: _profileName,
      content: content,
      imageUrl: localImgUrl,
      videoUrl: localVideoUrl,
      type: type,
      likes: 0,
      dateTime: DateTime.now(),
      comments: [],
    );

    if (_isServerRunning && targetIp == _myIpAddress) {
      setState(() { _posts.insert(0, newPost); _isUploading = false; _selectedImageFile = null; _selectedVideoFile = null; });
      _savePostsToLocal();
    } else {
      try {
        await http.post(Uri.parse('http://$targetIp:8080/add_post'), body: newPost.toJson());
      } catch (_) {}
      setState(() { _isUploading = false; _selectedImageFile = null; _selectedVideoFile = null; });
    }
    _contentCtrl.clear();
    Navigator.pop(context);
    _silentRefreshPosts();
  }

  void _showCreatePostBottomSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
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
                  Text("نشر محتوى باسم: $_profileName 📸", style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  const Divider(),
                  TextField(controller: _contentCtrl, maxLines: 2, decoration: const InputDecoration(hintText: "ماذا يدور في ذهنك؟...")),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      TextButton.icon(onPressed: () async {
                        final XFile? img = await _picker.pickImage(source: ImageSource.gallery);
                        if (img != null) setSheetState(() { _selectedImageFile = File(img.path); _selectedVideoFile = null; });
                      }, icon: const Icon(Icons.image, color: Colors.green), label: const Text("صورة")),
                      TextButton.icon(onPressed: () async {
                        final XFile? vid = await _picker.pickVideo(source: ImageSource.gallery);
                        if (vid != null) setSheetState(() { _selectedVideoFile = File(vid.path); _selectedImageFile = null; });
                      }, icon: const Icon(Icons.video_camera_back, color: Colors.pink), label: const Text("فيديو")),
                    ],
                  ),
                  const Divider(),
                  _isUploading ? const CircularProgressIndicator() : ElevatedButton(onPressed: () => _sendMediaPost('post'), child: const Text("نشر الآن")),
                  const SizedBox(height: 16),
                ],
              ),
            );
          },
        );
      },
    );
  }

  // شاشة تعديل وإظهار الحساب الشخصي (Profile View)
  Widget _buildProfileView() {
    final nameController = TextEditingController(text: _profileName);
    return SingleChildScrollView(
      child: Column(
        children: [
          // الغلاف والصورة الشخصية
          Stack(
            clipBehavior: Clip.none,
            alignment: Alignment.center,
            children: [
              GestureDetector(
                onTap: () async {
                  final XFile? img = await _picker.pickImage(source: ImageSource.gallery);
                  if (img != null) _saveProfileData(_profileName, _localAvatarPath, img.path);
                },
                child: Container(
                  height: 180,
                  width: double.infinity,
                  color: Colors.grey.shade300,
                  child: _localCoverPath != null 
                      ? Image.file(File(_localCoverPath!), fit: BoxFit.cover)
                      : const Center(child: Icon(Icons.add_a_photo, color: Colors.black54, size: 30)),
                ),
              ),
              Positioned(
                bottom: -50,
                child: GestureDetector(
                  onTap: () async {
                    final XFile? img = await _picker.pickImage(source: ImageSource.gallery);
                    if (img != null) _saveProfileData(_profileName, img.path, _localCoverPath);
                  },
                  child: CircleAvatar(
                    radius: 55,
                    backgroundColor: Colors.white,
                    child: CircleAvatar(
                      radius: 50,
                      backgroundColor: Colors.blue.shade100,
                      backgroundImage: _localAvatarPath != null ? FileImage(File(_localAvatarPath!)) : null,
                      child: _localAvatarPath == null ? const Icon(Icons.camera_alt, size: 30) : null,
                    ),
                  ),
                ),
              )
            ],
          ),
          const SizedBox(height: 60),
          // تفاصيل الاسم وتحديث الحساب
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Card(
              elevation: 2,
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  children: [
                    Text(_profileName, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 10),
                    TextField(
                      controller: nameController,
                      decoration: const InputDecoration(labelText: "تعديل الاسم المستعار", border: OutlineInputBorder()),
                    ),
                    const SizedBox(height: 12),
                    ElevatedButton.icon(
                      onPressed: () {
                        if (nameController.text.trim().isNotEmpty) {
                          _saveProfileData(nameController.text.trim(), _localAvatarPath, _localCoverPath);
                          _showNotification("تم تحديث ملفك الشخصي! ✨", Icons.badge);
                        }
                      },
                      icon: const Icon(Icons.save),
                      label: const Text("حفظ التغييرات"),
                    )
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final feedsList = _posts.where((p) => p.type == 'post').toList();

    return DefaultTabController(
      length: 3, // تم تغيير الطول إلى 3 لإضافة تبويب البروفايل
      child: Scaffold(
        appBar: AppBar(
          title: const Text("facebook", style: TextStyle(color: Color(0xFF1877F2), fontWeight: FontWeight.bold, fontSize: 26, letterSpacing: -0.5)),
          elevation: 1,
          actions: [
            IconButton(icon: Icon(_isInVoiceCall ? Icons.phone_in_talk : Icons.phone_disabled, color: _isInVoiceCall ? Colors.green : Colors.red), onPressed: _toggleVoiceCall),
            IconButton(icon: const Icon(Icons.add_box_outlined, color: Colors.black), onPressed: _showCreatePostBottomSheet),
            IconButton(icon: Icon(_isServerRunning ? Icons.wifi : Icons.wifi_find_rounded, color: _isServerRunning ? Colors.green : Colors.blue), onPressed: _getWifiIp)
          ],
          bottom: const TabBar(
            tabs: [
              Tab(icon: Icon(Icons.home, size: 26), text: "الأخبار"),
              Tab(icon: Icon(Icons.person, size: 26), text: "الملف الشخصي"),
              Tab(icon: Icon(Icons.movie_filter_outlined, size: 26), text: "ريلز"),
            ],
            indicatorColor: Color(0xFF1877F2),
            labelColor: Color(0xFF1877F2),
            unselectedLabelColor: Colors.grey,
          ),
        ),
        body: TabBarView(
          physics: const NeverScrollableScrollPhysics(),
          children: [
            // تبويب الأخبار الأساسي
            Column(
              children: [
                if (_isInVoiceCall)
                  Container(
                    color: Colors.green.shade600, padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 12),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text("المكالمة الصوتية الحية نشطة...", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                        IconButton(icon: Icon(_isMuted ? Icons.mic_off : Icons.mic, color: Colors.white, size: 18), onPressed: () => setState(() { _isMuted = !_isMuted; })),
                      ],
                    ),
                  ),
                Container(
                  color: Colors.white, padding: const EdgeInsets.all(8),
                  child: Row(
                    children: [
                      Icon(_isServerRunning ? Icons.radio_button_checked : Icons.radar_rounded, size: 18, color: _isServerRunning ? Colors.green : Colors.orange),
                      const SizedBox(width: 6),
                      Expanded(child: Text(_isServerRunning ? "بثك نشط على: $_myIpAddress" : "يبحث تلقائياً عن الأصدقاء... 🔍", style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold))),
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
                                    ],
                                  ),
                                  const SizedBox(height: 6),
                                  Text(post.content),
                                  if (post.imageUrl != null) Padding(padding: const EdgeInsets.only(top: 8), child: Image.network(post.imageUrl!)),
                                  if (post.videoUrl != null) Padding(padding: const EdgeInsets.only(top: 8), child: LocalVideoWidget(videoUrl: post.videoUrl!)),
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
            // تبويب الملف الشخصي الجديد (Profile)
            _buildProfileView(),
            // تبويب الريلز الفيديوهات
            const Center(child: Text("تبويب الريلز جاهز وبانتظار فيديوهاتكم! 🎬")),
          ],
        ),
      ),
    );
  }
}

class LocalVideoWidget extends StatefulWidget {
  final String videoUrl;
  const LocalVideoWidget({super.key, required this.videoUrl});

  @override
  State<LocalVideoWidget> createState() => _LocalVideoWidgetState();
}

class _LocalVideoWidgetState extends State<LocalVideoWidget> {
  late VideoPlayerController _controller;
  bool _isInitialized = false;

  @override
  void initState() {
    super.initState();
    _controller = VideoPlayerController.networkUrl(Uri.parse(widget.videoUrl))
      ..initialize().then((_) => setState(() { _isInitialized = true; _controller.setLooping(true); _controller.play(); }));
  }

  @override
  void dispose() { _controller.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    if (!_isInitialized) return const Center(child: CircularProgressIndicator());
    return AspectRatio(aspectRatio: _controller.value.aspectRatio, child: VideoPlayer(_controller));
  }
}

