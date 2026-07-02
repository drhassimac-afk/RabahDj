import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:shelf/shelf.dart' as shelf;
import 'package:shelf/shelf_io.dart' as shelf_io;
import 'package:shelf_router/shelf_router.dart' as shelf_router;
import 'package:http/http.dart' as http;
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
  final _imageCtrl = TextEditingController();
  final _ipServerCtrl = TextEditingController();

  String _myIpAddress = "جاري جلب الـ IP...";
  bool _isServerRunning = false;
  HttpServer? _localServer;
  Timer? _autoRefreshTimer;
  
  RawDatagramSocket? _udpSocket;
  Timer? _udpBroadcastTimer;

  @override
  void initState() {
    super.initState();
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
    _imageCtrl.dispose();
    _ipServerCtrl.dispose();
    _autoRefreshTimer?.cancel();
    _udpBroadcastTimer?.cancel();
    _udpSocket?.close();
    _localServer?.close();
    super.dispose();
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
    } catch (e) {
      setState(() => _myIpAddress = "تعذر جلب الـ IP");
    }
  }

  void _startLocalServer() async {
    final appRouter = shelf_router.Router();

    appRouter.get('/posts', (shelf.Request request) {
      final jsonList = _posts.map((p) => p.toMap()).toList();
      return shelf.Response.ok(jsonEncode(jsonList), headers: {'Content-Type': 'application/json; charset=utf-8'});
    });

    appRouter.post('/add_post', (shelf.Request request) async {
      final payload = await request.readAsString();
      setState(() {
        _posts.insert(0, PostModel.fromMap(jsonDecode(payload)));
      });
      return shelf.Response.ok(jsonEncode({'status': 'success'}));
    });

    appRouter.post('/like', (shelf.Request request) async {
      final payload = await request.readAsString();
      final id = jsonDecode(payload)['id'];
      setState(() {
        final index = _posts.indexWhere((p) => p.id == id);
        if (index != -1) _posts[index].likes++;
      });
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
      return shelf.Response.ok(jsonEncode({'status': 'comment_added'}));
    });

    try {
      _localServer = await shelf_io.serve(appRouter, InternetAddress.anyIPv4, 8080);
      setState(() {
        _isServerRunning = true;
        _ipServerCtrl.text = _myIpAddress;
      });
      _startUdpBroadcast();
    } catch (e) {
      print(e);
    }
  }

  void _startUdpBroadcast() async {
    try {
      _udpSocket = await RawDatagramSocket.bind(InternetAddress.anyIPv4, 0);
      _udpSocket?.broadcastEnabled = true;
      _udpBroadcastTimer = Timer.periodic(const Duration(seconds: 3), (timer) {
        _udpSocket?.send(utf8.encode("RABAH_DJ_HOST:$_myIpAddress"), InternetAddress('255.255.255.255'), 8888);
      });
    } catch (e) {
      print(e);
    }
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
              }
            }
          }
        }
      });
    } catch (e) {
      print(e);
    }
  }

  Future<void> _silentRefreshPosts() async {
    final targetIp = _ipServerCtrl.text.trim();
    if (targetIp.isEmpty) return;
    try {
      final response = await http.get(Uri.parse('http://$targetIp:8080/posts')).timeout(const Duration(seconds: 1));
      if (response.statusCode == 200) {
        final List decodedList = jsonDecode(utf8.decode(response.bodyBytes));
        setState(() {
          _posts = decodedList.map((item) => PostModel.fromMap(item)).toList();
        });
      }
    } catch (_) {}
  }

  Future<void> _sendPost() async {
    final content = _contentCtrl.text.trim();
    final user = _usernameCtrl.text.trim();
    final imgUrl = _imageCtrl.text.trim();
    final targetIp = _ipServerCtrl.text.trim();

    if (content.isEmpty || targetIp.isEmpty) return;

    final newPost = PostModel(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      username: user.isEmpty ? "مستخدم فيسبوك" : user,
      content: content,
      imageUrl: imgUrl.isEmpty ? null : imgUrl,
      likes: 0,
      dateTime: DateTime.now(),
      comments: [],
    );

    if (_isServerRunning && targetIp == _myIpAddress) {
      setState(() => _posts.insert(0, newPost));
    } else {
      try {
        await http.post(Uri.parse('http://$targetIp:8080/add_post'), body: newPost.toJson());
      } catch (e) {
        print(e);
      }
    }

    _contentCtrl.clear();
    _imageCtrl.clear();
    _silentRefreshPosts();
    FocusScope.of(context).unfocus();
  }

  Future<void> _sendLike(String id) async {
    final targetIp = _ipServerCtrl.text.trim();
    try {
      await http.post(Uri.parse('http://$targetIp:8080/like'), body: jsonEncode({'id': id}));
      _silentRefreshPosts();
    } catch (e) {
      print(e);
    }
  }

  Future<void> _sendComment(String postId, String text) async {
    final targetIp = _ipServerCtrl.text.trim();
    final user = _usernameCtrl.text.trim().isEmpty ? "مستخدم فيسبوك" : _usernameCtrl.text.trim();
    
    if (text.trim().isEmpty || targetIp.isEmpty) return;

    final commentObj = CommentModel(username: user, text: text, dateTime: DateTime.now());

    if (_isServerRunning && targetIp == _myIpAddress) {
      setState(() {
        final index = _posts.indexWhere((p) => p.id == postId);
        if (index != -1) _posts[index].comments.add(commentObj);
      });
    } else {
      try {
        await http.post(
          Uri.parse('http://$targetIp:8080/add_comment'),
          body: jsonEncode({
            'postId': postId,
            'comment': commentObj.toMap(),
          }),
        );
      } catch (e) {
        print(e);
      }
    }
    _silentRefreshPosts();
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
                  const Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey, borderRadius: BorderRadius.all(Radius.circular(10))))),
                  const SizedBox(height: 10),
                  const Text("التعليقات", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  const Divider(),
                  ConstrainedBox(
                    constraints: const BoxConstraints(maxHeight: 250),
                    child: post.comments.isEmpty
                        ? const Padding(padding: EdgeInsets.all(20.0), child: Center(child: Text("لا توجد تعليقات بعد، كن أول من يعلق!")))
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
                      Expanded(
                        child: TextField(
                          controller: commentInputCtrl,
                          decoration: const InputDecoration(hintText: "اكتب تعليقاً...", border: InputBorder.none),
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.send, color: Color(0xFF1877F2)),
                        onPressed: () async {
                          if (commentInputCtrl.text.trim().isNotEmpty) {
                            await _sendComment(post.id, commentInputCtrl.text);
                            setSheetState(() {
                              commentInputCtrl.clear();
                            });
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
    return Scaffold(
      appBar: AppBar(
        title: const Text("facebook"),
        elevation: 1,
        actions: [
          IconButton(
            icon: Icon(_isServerRunning ? Icons.wifi : Icons.wifi_find_rounded, color: _isServerRunning ? Colors.green : Colors.blue),
            onPressed: _getWifiIp,
          )
        ],
      ),
      body: GestureDetector(
        onTap: () => FocusScope.of(context).unfocus(),
        child: Column(
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
                      _isServerRunning 
                        ? "أنت المضيف النشط على شبكة الـ Wi-Fi" 
                        : (_ipServerCtrl.text.isNotEmpty ? "متصل تلقائياً بالمضيف: ${_ipServerCtrl.text}" : "جاري البحث التلقائي عن أصدقائك... 🔍"),
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey.shade700),
                    ),
                  ),
                  if (!_isServerRunning && _ipServerCtrl.text.isEmpty)
                    ElevatedButton(
                      onPressed: _startLocalServer,
                      style: ElevatedButton.styleFrom(backgroundColor: Colors.blue.shade50, foregroundColor: Colors.blue, elevation: 0),
                      child: const Text("ابدأ بث 📡", style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            Container(
              color: Colors.white,
              padding: const EdgeInsets.all(12),
              child: Column(
                children: [
                  Row(
                    children: [
                      CircleAvatar(
                        backgroundColor: Colors.blue.shade100,
                        child: Text(_usernameCtrl.text.isNotEmpty ? _usernameCtrl.text[0].toUpperCase() : "F", style: const TextStyle(color: Color(0xFF1877F2), fontWeight: FontWeight.bold)),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: TextField(controller: _usernameCtrl, decoration: const InputDecoration(hintText: "اسمك الشخصي...", border: InputBorder.none)),
                      ),
                    ],
                  ),
                  const Divider(height: 20, color: Color(0xFFE4E6EB)),
                  TextField(controller: _contentCtrl, maxLines: 2, decoration: const InputDecoration(hintText: "بماذا تفكر الآن؟", border: InputBorder.none)),
                  TextField(controller: _imageCtrl, style: const TextStyle(fontSize: 12, color: Colors.blue), decoration: const InputDecoration(hintText: "رابط صورة للمنشور (اختياري) 🖼️", border: InputBorder.none, isDense: true)),
                  const SizedBox(height: 8),
                  SizedBox(
                    width: double.infinity,
                    height: 38,
                    child: ElevatedButton(
                      onPressed: _sendPost,
                      style: ElevatedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6))),
                      child: const Text("نشر", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                    ),
                  )
                ],
              ),
            ),
            Expanded(
              child: _posts.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.feed, size: 48, color: Colors.grey.shade400),
                          const SizedBox(height: 8),
                          Text("لا توجد منشورات في شبكة الـ Wi-Fi حالياً", style: TextStyle(color: Colors.grey.shade500)),
                        ],
                      ),
                    )
                  : ListView.builder(
                      itemCount: _posts.length,
                      itemBuilder: (context, i) {
                        final post = _posts[i];
                        return Container(
                          color: Colors.white,
                          margin: const EdgeInsets.symmetric(vertical: 4),
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  CircleAvatar(
                                    backgroundColor: Colors.grey.shade200,
                                    child: Text(post.username[0].toUpperCase(), style: const TextStyle(color: Colors.black87, fontWeight: FontWeight.bold)),
                                  ),
                                  const SizedBox(width: 10),
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(post.username, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                                      Text("${post.dateTime.hour}:${post.dateTime.minute.toString().padLeft(2, '0')} عبر الشبكة المحلية", style: TextStyle(color: Colors.grey.shade500, fontSize: 11)),
                                    ],
                                  ),
                                ],
                              ),
                              const SizedBox(height: 10),
                              Text(post.content, style: const TextStyle(fontSize: 15, height: 1.4)),
                              const SizedBox(height: 10),
                              if (post.imageUrl != null)
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(8),
                                  child: Image.network(post.imageUrl!, fit: BoxFit.cover, width: double.infinity),
                                ),
                              const Divider(height: 24, color: Color(0xFFE4E6EB)),
                              Row(
                                children: [
                                  Expanded(
                                    child: TextButton.icon(
                                      onPressed: () => _sendLike(post.id),
                                      icon: const Icon(Icons.thumb_up_alt_outlined, size: 20),
                                      label: Text("إعجاب (${post.likes})", style: const TextStyle(fontWeight: FontWeight.bold)),
                                    ),
                                  ),
                                  Expanded(
                                    child: TextButton.icon(
                                      onPressed: () => _showCommentsSheet(post),
                                      icon: const Icon(Icons.mode_comment_outlined, size: 20),
                                      label: Text("تعليق (${post.comments.length})", style: const TextStyle(fontWeight: FontWeight.bold)),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
