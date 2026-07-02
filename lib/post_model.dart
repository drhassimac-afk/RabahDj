import 'dart:convert';

class CommentModel {
  final String username;
  final String text;
  final DateTime dateTime;

  CommentModel({
    required this.username,
    required this.text,
    required this.dateTime,
  });

  Map<String, dynamic> toMap() {
    return {
      'username': username,
      'text': text,
      'dateTime': dateTime.toIso8601String(),
    };
  }

  factory CommentModel.fromMap(Map<String, dynamic> map) {
    return CommentModel(
      username: map['username'] ?? 'مستجيب مجهول',
      text: map['text'] ?? '',
      dateTime: DateTime.parse(map['dateTime'] ?? DateTime.now().toIso8601String()),
    );
  }
}

class PostModel {
  final String id;
  final String username;
  final String content;
  final String? imageUrl;
  int likes;
  final DateTime dateTime;
  List<CommentModel> comments; // ميزة التعليقات الجديدة

  PostModel({
    required this.id,
    required this.username,
    required this.content,
    this.imageUrl,
    required this.likes,
    required this.dateTime,
    required this.comments,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'username': username,
      'content': content,
      'imageUrl': imageUrl,
      'likes': likes,
      'dateTime': dateTime.toIso8601String(),
      'comments': comments.map((c) => c.toMap()).toList(),
    };
  }

  factory PostModel.fromMap(Map<String, dynamic> map) {
    var commentsList = map['comments'] as List? ?? [];
    return PostModel(
      id: map['id'] ?? '',
      username: map['username'] ?? 'RabahDj User',
      content: map['content'] ?? '',
      imageUrl: map['imageUrl'],
      likes: map['likes'] ?? 0,
      dateTime: DateTime.parse(map['dateTime'] ?? DateTime.now().toIso8601String()),
      comments: commentsList.map((c) => CommentModel.fromMap(c)).toList(),
    );
  }

  String toJson() => json.encode(toMap());
}
