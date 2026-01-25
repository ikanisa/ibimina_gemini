class Article {
  final String id;
  final String title;
  final String content;
  final String categoryId;

  const Article({
    required this.id,
    required this.title,
    required this.content,
    required this.categoryId,
  });
}

class ArticleCategory {
  final String id;
  final String title;
  final String icon; // Asset path or emoji for now

  const ArticleCategory({
    required this.id,
    required this.title,
    required this.icon,
  });
}
