import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:shelf/shelf.dart' as shelf;
import 'package:shelf/shelf_io.dart' as shelf_io;
import 'package:shelf_router/shelf_router.dart' as shelf_router; // تعديل ذكي لمنع التداخل
import 'package:http/http.dart' as http;
import 'post_model.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const RabahDjLocalApp());
}

class RabahDjLocalApp extends StatelessWidget {
  const RabahDjLocalApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'RabahDj Wi-Fi Pro',
      theme: ThemeData.dark(useMaterial3: true).copyWith(
        colorScheme: const ColorScheme.dark(primary: Colors.cyanAccent),
      ),
      home: const LocalHomePage(),
    );
  }
}

class LocalHomePage extends StatefulWidget {
  const LocalHomePage({super.key});

  @override
  State<LocalHomePage> createState() => _LocalHomePageState();
}

class _LocalHomePageState extends State<LocalHomePage> {
  List<PostModel> _localPosts = [];
  final _usernameCtrl = TextEditingController();
  final _contentCtrl = TextEditingController();
  final _ipServerCtrl = TextEditingController();

  String _myIpAddress = "جاري جلب الـ IP...";
  bool _isServerRunning = false;
  HttpServer? _localServer;

  @override
  void initState() {
    super.initState();
    _getWifiIp();
  }

  @override
  void dispose() {
    _usernameCtrl.dispose();
    _contentCtrl.dispose();
    _ipServerCtrl.dispose();
    _localServer?.close();
    super.dispose();
  }

  Future<void> _getWifiIp() async {
    try {
      for (var interface in await NetworkInterface.list()) {
        for (var addr in interface.addresses) {
          if (addr.type == InternetAddressType.IPv4 && !addr.isLoopback) {
            setState(() {
              _myIpAddress = addr.address;
              _ipServerCtrl.text = _myIpAddress;
            });
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
    final appRouter = shelf_router.Router(); // تم حل التداخل هنا بنجاح

    appRouter.get('/posts', (shelf.Request request) {
      final jsonList = _localPosts.map((p) => p.toMap()).toList();
      return shelf.Response.ok(jsonEncode(jsonList), headers: {'Content-Type': 'application/json'});
    });

    appRouter.post('/add_post', (shelf.Request request) async {
      final payload = await request.readAsString();
      final data = jsonDecode(payload);
      setState(() {
        _localPosts.insert(0, PostModel.fromMap(data));
      });
      return shelf.Response.ok(jsonEncode({'status': 'success'}));
    });

    appRouter.post('/like', (shelf.Request request) async {
      final payload = await request.readAsString();
      final id = jsonDecode(payload)['id'];
      setState(() {
        final index = _localPosts.indexWhere((p) => p.id == id);
        if (index != -1) _localPosts[index].likes++;
      });
      return shelf.Response.ok(jsonEncode({'status': 'liked'}));
    });

    try {
      _localServer = await shelf_io.serve(appRouter, InternetAddress.anyIPv4, 8080);
      setState(() {
        _isServerRunning = true;
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("فشل تشغيل السيرفر: $e")));
    }
  }

  Future<void> _refreshNetworkPosts() async {
    final targetIp = _ipServerCtrl.text.trim();
    if (targetIp.isEmpty) return;

    try {
      final response = await http.get(Uri.parse('http://$targetIp:8080/posts')).timeout(const Duration(seconds: 3));
      if (response.statusCode == 200) {
        final List decodedList = jsonDecode(response.body);
        setState(() {
          _localPosts = decodedList.map((item) => PostModel.fromMap(item)).toList();
        });
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("فشل الاتصال بجهاز المضيف!")));
    }
  }

  Future<void> _sendPostToNetwork() async {
    final content = _contentCtrl.text.trim();
    final user = _usernameCtrl.text.trim();
    final targetIp = _ipServerCtrl.text.trim();

    if (content.isEmpty || targetIp.isEmpty) return;

    final newPost = PostModel(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      username: user.isEmpty ? "LocalUser" : user,
      content: content,
      likes: 0,
    );

    if (_isServerRunning && targetIp == _myIpAddress) {
      setState(() {
        _localPosts.insert(0, newPost);
      });
    } else {
      try {
        await http.post(Uri.parse('http://$targetIp:8080/add_post'), body: newPost.toJson());
      } catch (e) {
        print(e);
      }
    }

    _contentCtrl.clear();
    _refreshNetworkPosts();
    FocusScope.of(context).unfocus();
  }

  Future<void> _sendLike(String id) async {
    final targetIp = _ipServerCtrl.text.trim();
    try {
      await http.post(Uri.parse('http://$targetIp:8080/like'), body: jsonEncode({'id': id}));
      _refreshNetworkPosts();
    } catch (e) {
      print(e);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("📡 RabahDj Wi-Fi Network"),
        actions: [
          IconButton(icon: const Icon(Icons.refresh, color: Colors.cyanAccent), onPressed: _refreshNetworkPosts)
        ],
      ),
      body: GestureDetector(
        onTap: () => FocusScope.of(context).unfocus(),
        child: Column(
          children: [
            Container(
              color: const Color(0xFF1E1E1E),
              padding: const EdgeInsets.all(12),
              child: Column(
                children: [
                  Text("IP الخاص بك: $_myIpAddress", style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.grey)),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _ipServerCtrl,
                          decoration: const InputDecoration(hintText: "أدخل IP Mofid", border: OutlineInputBorder(), isDense: true),
                        ),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton(
                        onPressed: _isServerRunning ? null : _startLocalServer,
                        style: ElevatedButton.styleFrom(backgroundColor: _isServerRunning ? Colors.green : Colors.blueGrey),
                        child: Text(_isServerRunning ? "أنت المضيف 🟢" : "اجعلني المضيف 📡"),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(12.0),
              child: Column(
                children: [
                  TextField(controller: _usernameCtrl, decoration: const InputDecoration(hintText: "اسمك المستعار", prefixIcon: Icon(Icons.person))),
                  const SizedBox(height: 8),
                  TextField(controller: _contentCtrl, decoration: const InputDecoration(hintText: "اكتب رسالة للشبكة... 💬", prefixIcon: Icon(Icons.wifi))),
                  const SizedBox(height: 8),
                  SizedBox(
                    width: double.infinity,
                    height: 45,
                    child: ElevatedButton(
                      onPressed: _sendPostToNetwork,
                      style: ElevatedButton.styleFrom(backgroundColor: Colors.cyanAccent, foregroundColor: Colors.black),
                      child: const Text("بث في الشبكة 🚀", style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ),
            const Divider(),
            Expanded(
              child: _localPosts.isEmpty
                  ? const Center(child: Text("اضغط على زر التحديث 🔄 لجلب منشورات الشبكة!"))
                  : ListView.builder(
                      itemCount: _localPosts.length,
                      itemBuilder: (context, i) {
                        final post = _localPosts[i];
                        return Card(
                          margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          child: ListTile(
                            title: Text("@${post.username}", style: const TextStyle(color: Colors.cyanAccent, fontWeight: FontWeight.bold)),
                            subtitle: Text(post.content),
                            trailing: TextButton.icon(
                              icon: const Icon(Icons.favorite, color: Colors.red),
                              label: Text("${post.likes}"),
                              onPressed: () => _sendLike(post.id),
                            ),
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
