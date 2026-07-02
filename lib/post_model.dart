import 'dart:convert';

class PostModel {
  final String id;
  final String username;
  final String content;
  final String? imageUrl; // ميزة جديدة لدعم الصور داخل المنشور
  int likes;
  final DateTime dateTime;

  PostModel({
    required this.id,
    required this.username,
    required this.content,
    this.imageUrl,
    required this.likes,
    required this.dateTime,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'username': username,
      'content': content,
      'imageUrl': imageUrl,
      'likes': likes,
      'dateTime': dateTime.toIso8601String(),
    };
  }

  factory PostModel.fromMap(Map<String, dynamic> map) {
    return PostModel(
      id: map['id'] ?? '',
      username: map['username'] ?? 'RabahDj User',
      content: map['content'] ?? '',
      imageUrl: map['imageUrl'],
      likes: map['likes'] ?? 0,
      dateTime: DateTime.parse(map['dateTime'] ?? DateTime.now().toIso8601String()),
    );
  }

  String toJson() => json.encode(toMap());
  factory PostModel.fromJson(String source) => PostModel.fromMap(json.decode(source));
}
