import 'package:flutter/material.dart';
import '../../../../ui/tokens/colors.dart';
import '../models/article_model.dart';
import 'whatsapp_handoff_sheet.dart';

class ArticleDetailScreen extends StatelessWidget {
  final Article article;

  const ArticleDetailScreen({super.key, required this.article});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('Help Article'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              article.title,
              style: theme.textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              article.content,
              style: theme.textTheme.bodyLarge?.copyWith(
                height: 1.6,
              ),
            ),
            
            const SizedBox(height: 48),
            const Divider(),
            const SizedBox(height: 24),
            
            Text(
              'Still need help?',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                icon: const Icon(Icons.chat_bubble_outline),
                label: const Text('Chat with Support'),
                onPressed: () => showModalBottomSheet(
                  context: context,
                  isScrollControlled: true,
                  builder: (context) => WhatsappHandoffSheet(
                    source: 'article_${article.id}',
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
