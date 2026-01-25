import 'package:flutter/material.dart';
import '../../../../ui/tokens/colors.dart';
import '../models/article_model.dart';
import '../data/faq_data.dart';
import 'article_detail_screen.dart';
import 'whatsapp_handoff_sheet.dart';
import '../widgets/service_status_widget.dart';

class HelpCenterScreen extends StatefulWidget {
  const HelpCenterScreen({super.key});

  @override
  State<HelpCenterScreen> createState() => _HelpCenterScreenState();
}

class _HelpCenterScreenState extends State<HelpCenterScreen> {
  String _searchQuery = '';

  List<Article> get _filteredArticles {
    if (_searchQuery.isEmpty) return kHelpArticles;
    return kHelpArticles
        .where((article) =>
            article.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
            article.content.toLowerCase().contains(_searchQuery.toLowerCase()))
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Help Center'),
      ),
      body: Column(
        children: [
          // Service Status
          const ServiceStatusWidget(),
          
          // Search Bar
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              onChanged: (value) => setState(() => _searchQuery = value),
              decoration: InputDecoration(
                hintText: 'Search help articles...',
                prefixIcon: const Icon(Icons.search),
                filled: true,
                fillColor: isDark ? AppColors.darkSurfaceVariant : AppColors.lightSurfaceVariant,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),

          // Content
          Expanded(
            child: _searchQuery.isNotEmpty
                ? _buildSearchResults()
                : _buildCategoriesList(theme),
          ),
          
          // Contact Support Button
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                icon: const Icon(Icons.chat_bubble_outline),
                label: const Text('Contact Support'),
                onPressed: () => showModalBottomSheet(
                  context: context,
                  isScrollControlled: true,
                  builder: (context) => const WhatsappHandoffSheet(
                    source: 'help_center_home',
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchResults() {
    if (_filteredArticles.isEmpty) {
      return const Center(
        child: Text('No articles found'),
      );
    }
    return ListView.builder(
      itemCount: _filteredArticles.length,
      itemBuilder: (context, index) {
        final article = _filteredArticles[index];
        return ListTile(
          title: Text(article.title),
          subtitle: Text(
            article.content.replaceAll('\n', ' '),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          onTap: () => _openArticle(article),
        );
      },
    );
  }

  Widget _buildCategoriesList(ThemeData theme) {
    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      children: [
        for (final category in kHelpCategories) ...[
          Padding(
            padding: const EdgeInsets.only(top: 24, bottom: 8),
            child: Text(
              '${category.icon}  ${category.title}',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          ...kHelpArticles
              .where((a) => a.categoryId == category.id)
              .map((article) => Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: ListTile(
                      title: Text(article.title),
                      trailing: const Icon(Icons.chevron_right, size: 20),
                      onTap: () => _openArticle(article),
                    ),
                  )),
        ],
      ],
    );
  }

  void _openArticle(Article article) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ArticleDetailScreen(article: article),
      ),
    );
  }
}
