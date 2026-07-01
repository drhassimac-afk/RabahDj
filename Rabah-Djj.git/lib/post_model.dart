import 'dart:convert';

class PostModel {
  final String id;
  final String username;
  final String content;
  int likes;

  PostModel({
    required this.id,
    required this.username,
    required this.content,
    required this.likes,
  });

  Map<String, dynamic> toMap() {
    return {'id': id, 'username': username, 'content': content, 'likes': likes};
  }

  factory PostModel.fromMap(Map<String, dynamic> map) {
    return PostModel(
      id: map['id'] ?? '',
      username: map['username'] ?? 'RabahDj Local',
      content: map['content'] ?? '',
      likes: map['likes'] ?? 0,
    );
  }

  String toJson() => json.encode(toMap());
  factory PostModel.fromJson(String source) => PostModel.fromMap(json.decode(source));
}
