import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:shelf/shelf.dart' as shelf;
import 'package:shelf/shelf_io.dart' as shelf_io;
import 'package:shelf_router/shelf_router.dart' as shelf_router;
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:video_player/video_player.dart';
import 'package:image_picker/image_picker.dart'; // المكتبة الجديدة
import 'package:path_provider/path_provider.dart'; // لتخزين الملفات محلياً وبثها
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

  // متغيرات اختيار الملفات الحقيقية
  final ImagePicker _picker = ImagePicker();
  File? _selectedImageFile;
  File? _selectedVideoFile;
  bool _isUploading = false;

  @override
  void initState() {
    super.initState();
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
    super.dispose();
  }

  Future<void> _savePostsToLocal() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final jsonList = _posts.map((p) => p.toMap()).toList();
      await prefs.setString('local_posts_v3_backup', jsonEncode(jsonList));
    } catch (_) {}
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

  void _checkForNotifications(List<PostModel> newPosts) {
    if (_posts.isEmpty && newPosts.isNotEmpty) return;
    if (newPosts.length > _posts.length) {
      final latest = newPosts.first;
      String typeLabel = latest.type == 'reels' ? "مقطع ريلز جديد" : (latest.type == 'story' ? "قصة جديدة" : "منشور جديد");
      _showNotification("قام ${latest.username} بنشر $typeLabel! 🚀", Icons.quickreply_rounded);
    }
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
    } catch (_) {
      setState(() => _myIpAddress = "تعذر جلب الـ IP");
    }
  }

  // دالة ذكية لاختيار صورة من المعرض
  Future<void> _pickImage(StateSetter setSheetState) async {
    final XFile? image = await _picker.pickImage(source: ImageSource.gallery);
    if (image != null) {
      setSheetState(() {
        _selectedImageFile = File(image.path);
        _selectedVideoFile = null; // إلغاء الفيديو إذا تم اختيار صورة
      });
    }
  }

  // دالة ذكية لاختيار فيديو من المعرض
  Future<void> _pickVideo(StateSetter setSheetState) async {
    final XFile? video = await _picker.pickVideo(source: ImageSource.gallery);
    if (video != null) {
      setSheetState(() {
        _selectedVideoFile = File(video.path);
        _selectedImageFile = null; // إلغاء الصورة إذا تم اختيار فيديو
      });
    }
  }

  void _startLocalServer() async {
    final appRouter = shelf_router.Router();

    // مسار جلب المنشورات
    appRouter.get('/posts', (shelf.Request request) {
      final jsonList = _posts.map((p) => p.toMap()).toList();
      return shelf.Response.ok(jsonEncode(jsonList), headers: {'Content-Type': 'application/json; charset=utf-8'});
    });

    // مسار بث الملفات والصور والفيديوهات المرفوعة محلياً لأي شخص في الشبكة
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

    appRouter.post('/like', (shelf.Request request) async {
      final payload = await request.readAsString();
      final id = jsonDecode(payload)['id'];
      setState(() {
        final index = _posts.indexWhere((p) => p.id == id);
        if (index != -1) _posts[index].likes++;
      });
      _savePostsToLocal();
      return shelf.Response.ok(jsonEncode({'status': 'liked'}));
    });

    appRouter.post('/add_comment', (shelf.Request request) async {
      final payload = await request.readAsString();
      final data = jsonDecode(payload);
      final postId = data['postId'];
      final commentData = data['comment'];

      setState(() {
        final index = _posts.indexWhere((p) => p.id == postId);
        if (index != -1) {
          _posts[index].comments.add(CommentModel.fromMap(commentData));
        }
      });
      _savePostsToLocal();
      return shelf.Response.ok(jsonEncode({'status': 'comment_added'}));
    });

    try {
      _localServer = await shelf_io.serve(appRouter, InternetAddress.anyIPv4, 8080);
      setState(() {
        _isServerRunning = true;
        _ipServerCtrl.text = _myIpAddress;
      });
      _startUdpBroadcast();
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
        final List<PostModel> incomingPosts = decodedList.map((item) => PostModel.fromMap(item)).toList();
        _checkForNotifications(incomingPosts);
        setState(() { _posts = incomingPosts; });
        _savePostsToLocal();
      }
    } catch (_) {}
  }

  // دالة النشر الذكية المتوافقة مع ملفات الاستوديو الحقيقية والبث المحلي
  Future<void> _sendMediaPost(String type) async {
    final content = _contentCtrl.text.trim();
    final user = _usernameCtrl.text.trim();
    final targetIp = _ipServerCtrl.text.trim();

    if (content.isEmpty && _selectedImageFile == null && _selectedVideoFile == null) return;
    if (targetIp.isEmpty) return;

    setState(() => _isUploading = true);

    String? localImgUrl;
    String? localVideoUrl;

    // معالجة وحفظ الصورة المحددة داخل السيرفر المحلي لبثها للآخرين
    if (_selectedImageFile != null) {
      final docDir = await getApplicationDocumentsDirectory();
      final fileName = 'img_${DateTime.now().millisecondsSinceEpoch}.jpg';
      final savedFile = await _selectedImageFile!.copy('${docDir.path}/$fileName');
      localImgUrl = 'http://$_myIpAddress:8080/files/$fileName';
    }

    // معالجة وحفظ الفيديو المحدد داخل السيرفر المحلي لبثه للآخرين
    if (_selectedVideoFile != null) {
      final docDir = await getApplicationDocumentsDirectory();
      final fileName = 'vid_${DateTime.now().millisecondsSinceEpoch}.mp4';
      final savedFile = await _selectedVideoFile!.copy('${docDir.path}/$fileName');
      localVideoUrl = 'http://$_myIpAddress:8080/files/$fileName';
    }

    final newPost = PostModel(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      username: user.isEmpty ? "مستخدم محلي" : user,
      content: content,
      imageUrl: localImgUrl,
      videoUrl: localVideoUrl,
      type: type,
      likes: 0,
      dateTime: DateTime.now(),
      comments: [],
    );

    if (_isServerRunning && targetIp == _myIpAddress) {
      setState(() {
        _posts.insert(0, newPost);
        _isUploading = false;
        _selectedImageFile = null;
        _selectedVideoFile = null;
      });
      _savePostsToLocal();
      _showNotification("تم نشر محتواك من المعرض بنجاح! 🎉", Icons.check_circle);
    } else {
      try {
        final res = await http.post(Uri.parse('http://$targetIp:8080/add_post'), body: newPost.toJson());
        if (res.statusCode == 200) {
          _showNotification("تم الإرسال إلى شبكة الصديق! 🚀", Icons.send);
        }
      } catch (_) {}
      setState(() {
        _isUploading = false;
        _selectedImageFile = null;
        _selectedVideoFile = null;
      });
    }

    _contentCtrl.clear();
    _silentRefreshPosts();
    Navigator.pop(context);
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
                  const Text("إنشاء محتوى من المعرض 📸", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                  const Divider(),
                  TextField(controller: _usernameCtrl, decoration: const InputDecoration(hintText: "اسمك المستعار...", prefixIcon: Icon(Icons.person))),
                  TextField(controller: _contentCtrl, maxLines: 2, decoration: const InputDecoration(hintText: "اكتب تفاصيل أو نص هنا...")),
                  const SizedBox(height: 12),
                  
                  // عرض معاينة للملف المختار من الهاتف قبل النشر
                  if (_selectedImageFile != null)
                    Container(height: 100, width: 100, margin: const EdgeInsets.only(bottom: 10), decoration: BoxDecoration(borderRadius: BorderRadius.circular(8), image: DecorationImage(image: FileImage(_selectedImageFile!), fit: BoxFit.cover)))
                  else if (_selectedVideoFile != null)
                    Container(height: 60, padding: const EdgeInsets.all(8), margin: const EdgeInsets.only(bottom: 10), decoration: BoxDecoration(color: Colors.pink.shade50, borderRadius: BorderRadius.circular(8)), child: const Row(children: [Icon(Icons.video_collection, color: Colors.pink), SizedBox(width: 8), Text("تم اختيار فيديو من الهاتف جاهز للبث", style: TextStyle(color: Colors.pink, fontSize: 12))])) ,
                  
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      TextButton.icon(onPressed: () => _pickImage(setSheetState), icon: const Icon(Icons.image, color: Colors.green), label: const Text("معرض الصور")),
                      const SizedBox(width: 20),
                      TextButton.icon(onPressed: () => _pickVideo(setSheetState), icon: const Icon(Icons.video_camera_back, color: Colors.pink), label: const Text("معرض الفيديو")),
                    ],
                  ),
                  const Divider(),
                  _isUploading 
                    ? const Padding(padding: EdgeInsets.all(8.0), child: CircularProgressIndicator())
                    : Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          ElevatedButton.icon(onPressed: () => _sendMediaPost('post'), icon: const Icon(Icons.feed), label: const Text("منشور")),
                          ElevatedButton.icon(onPressed: () => _sendMediaPost('reels'), icon: const Icon(Icons.movie_creation_outlined), label: const Text("ريلز"), style: ElevatedButton.styleFrom(backgroundColor: Colors.pink.shade50, foregroundColor: Colors.pink)),
                          ElevatedButton.icon(onPressed: () => _sendMediaPost('story'), icon: const Icon(Icons.history_toggle_off), label: const Text("قصة"), style: ElevatedButton.styleFrom(backgroundColor: Colors.amber.shade50, foregroundColor: Colors.amber.shade900)),
                        ],
                      ),
                  const SizedBox(height: 16),
                ],
              ),
            );
          },
        );
      },
    );
  }

  void _showCommentsSheet(PostModel post) {
    final commentInputCtrl = TextEditingController();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            return Padding(
              padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom, top: 12, left: 12, right: 12),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(child: Container(width: 40, height: 4, decoration: const BoxDecoration(color: Colors.grey, borderRadius: BorderRadius.all(Radius.circular(10))))),
                  const SizedBox(height: 10),
                  const Text("التعليقات الحية", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  const Divider(),
                  ConstrainedBox(
                    constraints: const BoxConstraints(maxHeight: 250),
                    child: post.comments.isEmpty
                        ? const Padding(padding: EdgeInsets.all(20.0), child: Center(child: Text("لا توجد تعليقات بعد.")))
                        : ListView.builder(
                            shrinkWrap: true,
                            itemCount: post.comments.length,
                            itemBuilder: (context, index) {
                              final comment = post.comments[index];
                              return Container(
                                decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(12)),
                                margin: const EdgeInsets.symmetric(vertical: 4),
                                padding: const EdgeInsets.all(8),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(comment.username, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF1877F2))),
                                    const SizedBox(height: 2),
                                    Text(comment.text, style: const TextStyle(fontSize: 14)),
                                  ],
                                ),
                              );
                            },
                          ),
                  ),
                  const Divider(),
                  Row(
                    children: [
                      Expanded(child: TextField(controller: commentInputCtrl, decoration: const InputDecoration(hintText: "اكتب تعليقاً...", border: InputBorder.none))),
                      IconButton(
                        icon: const Icon(Icons.send, color: Color(0xFF1877F2)),
                        onPressed: () async {
                          if (commentInputCtrl.text.trim().isNotEmpty) {
                            final user = _usernameCtrl.text.trim().isEmpty ? "مستخدم محلي" : _usernameCtrl.text.trim();
                            final commentObj = CommentModel(username: user, text: commentInputCtrl.text, dateTime: DateTime.now());
                            setState(() { post.comments.add(commentObj); });
                            try {
                              final targetIp = _ipServerCtrl.text.trim();
                              await http.post(Uri.parse('http://$targetIp:8080/add_comment'), body: jsonEncode({'postId': post.id, 'comment': commentObj.toMap()}));
                            } catch (_) {}
                            setSheetState(() { commentInputCtrl.clear(); });
                            setState(() {});
                          }
                        },
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final feedsList = _posts.where((p) => p.type == 'post').toList();
    final reelsList = _posts.where((p) => p.type == 'reels').toList();
    final storiesList = _posts.where((p) => p.type == 'story').toList();

    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text("facebook", style: TextStyle(color: Color(0xFF1877F2), fontWeight: FontWeight.bold, fontSize: 26, letterSpacing: -0.5)),
          elevation: 1,
          actions: [
            IconButton(icon: const Icon(Icons.add_box_outlined, color: Colors.black, size: 28), onPressed: _showCreatePostBottomSheet),
            IconButton(icon: Icon(_isServerRunning ? Icons.wifi : Icons.wifi_find_rounded, color: _isServerRunning ? Colors.green : Colors.blue), onPressed: _getWifiIp)
          ],
          bottom: const TabBar(
            tabs: [
              Tab(icon: Icon(Icons.home, size: 28), text: "الأخبار"),
              Tab(icon: Icon(Icons.movie_filter_outlined, size: 28), text: "ريلز"),
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
                Container(
                  color: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  child: Row(
                    children: [
                      Icon(_isServerRunning ? Icons.radio_button_checked : Icons.radar_rounded, size: 18, color: _isServerRunning ? Colors.green : Colors.orange),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          _isServerRunning ? "بثك المطور نشط على: $_myIpAddress" : (_ipServerCtrl.text.isNotEmpty ? "متصل بالمضيف: ${_ipServerCtrl.text}" : "يبحث تلقائياً عن الأصدقاء... 🔍"),
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                        ),
                      ),
                      if (!_isServerRunning && _ipServerCtrl.text.isEmpty)
                        ElevatedButton(onPressed: _startLocalServer, child: const Text("ابدأ بث 📡")),
                    ],
                  ),
                ),
                if (storiesList.isNotEmpty)
                  Container(
                    height: 100,
                    color: Colors.white,
                    margin: const EdgeInsets.symmetric(vertical: 4),
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      itemCount: storiesList.length,
                      itemBuilder: (context, idx) {
                        final story = storiesList[idx];
                        return Container(
                          width: 75,
                          margin: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(12),
                            color: Colors.blue.shade100,
                            image: story.imageUrl != null ? DecorationImage(image: NetworkImage(story.imageUrl!), fit: BoxFit.cover) : null,
                          ),
                          child: Center(
                            child: Text(story.username, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 10, shadows: [Shadow(blurRadius: 4, color: Colors.black)])),
                          ),
                        );
                      },
                    ),
                  ),
                Expanded(
                  child: feedsList.isEmpty
                      ? const Center(child: Text("لا توجد منشورات نصية أو صور حالياً"))
                      : ListView.builder(
                          itemCount: feedsList.length,
                          itemBuilder: (context, i) {
                            final post = feedsList[i];
                            return Container(
                              color: Colors.white,
                              margin: const EdgeInsets.symmetric(vertical: 4),
                              padding: const EdgeInsets.all(12),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(post.username, style: const TextStyle(fontWeight: FontWeight.bold)),
                                  const SizedBox(height: 6),
                                  Text(post.content),
                                  if (post.imageUrl != null) Padding(padding: const EdgeInsets.only(top: 8), child: Image.network(post.imageUrl!)),
                                  if (post.videoUrl != null) Padding(padding: const EdgeInsets.only(top: 8), child: LocalVideoWidget(videoUrl: post.videoUrl!)),
                                  const Divider(),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                                    children: [
                                      TextButton.icon(onPressed: () { setState(() { post.likes++; }); }, icon: const Icon(Icons.thumb_up_outlined), label: Text("إعجاب (${post.likes})")),
                                      TextButton.icon(onPressed: () => _showCommentsSheet(post), icon: const Icon(Icons.comment), label: Text("تعليق (${post.comments.length})")),
                                    ],
                                  )
                                ],
                              ),
                            );
                          },
                        ),
                ),
              ],
            ),
            reelsList.isEmpty
                ? const Center(child: Text("لا توجد مقاطع ريلز منشورة حالياً 🎬"))
                : PageView.builder(
                    scrollDirection: Axis.vertical,
                    itemCount: reelsList.length,
                    itemBuilder: (context, index) {
                      final reel = reelsList[index];
                      return Stack(
                        children: [
                          Positioned.fill(child: Container(color: Colors.black, child: LocalVideoWidget(videoUrl: reel.videoUrl ?? ''))),
                          Positioned(
                            bottom: 20, left: 16, right: 80,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(reel.username, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                                const SizedBox(height: 6),
                                Text(reel.content, style: const TextStyle(color: Colors.white70, fontSize: 14)),
                              ],
                            ),
                          ),
                          Positioned(
                            bottom: 40, right: 16,
                            child: Column(
                              children: [
                                IconButton(icon: const Icon(Icons.favorite, color: Colors.red), onPressed: () { setState(() { reel.likes++; }); }),
                                Text("${reel.likes}", style: const TextStyle(color: Colors.white)),
                                const SizedBox(height: 16),
                                IconButton(icon: const Icon(Icons.comment, color: Colors.white), onPressed: () => _showCommentsSheet(reel)),
                                Text("${reel.comments.length}", style: const TextStyle(color: Colors.white)),
                              ],
                            ),
                          )
                        ],
                      );
                    },
                  ),
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
      ..initialize().then((_) {
        setState(() {
          _isInitialized = true;
          _controller.setLooping(true);
          _controller.play();
        });
      });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!_isInitialized) {
      return const Center(child: CircularProgressIndicator(color: Colors.blue));
    }
    return AspectRatio(
      aspectRatio: _controller.value.aspectRatio,
      child: Stack(
        alignment: Alignment.bottomCenter,
        children: [
          VideoPlayer(_controller),
          VideoProgressIndicator(_controller, allowScrubbing: true),
          Positioned(
            top: 10, right: 10,
            child: CircleAvatar(
              backgroundColor: Colors.black45,
              child: IconButton(
                icon: Icon(_controller.value.isPlaying ? Icons.pause : Icons.play_arrow, color: Colors.white),
                onPressed: () {
                  setState(() { _controller.value.isPlaying ? _controller.pause() : _controller.play(); });
                },
              ),
            ),
          )
        ],
      ),
    );
  }
}
