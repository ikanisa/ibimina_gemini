import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ibimina_mobile/features/invites/providers/invite_providers.dart';

class JoinGroupScreen extends ConsumerStatefulWidget {
  final String token;

  const JoinGroupScreen({super.key, required this.token});

  @override
  ConsumerState<JoinGroupScreen> createState() => _JoinGroupScreenState();
}

class _JoinGroupScreenState extends ConsumerState<JoinGroupScreen> {
  bool _isLoading = true;
  bool _isJoining = false;
  Map<String, dynamic>? _inviteDetails;
  String? _error;

  @override
  void initState() {
    super.initState();
    _validateToken();
  }

  Future<void> _validateToken() async {
    final service = ref.read(inviteServiceProvider);
    final res = await service.validateInvite(widget.token);
    if (!mounted) return;

    setState(() {
      _isLoading = false;
      if (res['valid'] == true) {
        _inviteDetails = res;
      } else {
        _error = res['error'] ?? 'Invalid invite';
      }
    });
  }

  Future<void> _joinGroup() async {
    setState(() {
      _isJoining = true;
    });

    final service = ref.read(inviteServiceProvider);
    final res = await service.acceptInvite(widget.token);

    if (!mounted) return;

    if (res['status'] == 'joined') {
      // Success! Navigate to Home or Group
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Joined group successfully!')),
      );
      // Navigate to dashboard - assuming generic pop or specific route
      Navigator.of(context).popUntil((route) => route.isFirst);
    } else if (res['status'] == 'already_member') {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('You are already a member of this group.')),
      );
      Navigator.of(context).popUntil((route) => route.isFirst);
    } else {
      setState(() {
        _isJoining = false;
        _error = res['message'] ?? 'Failed to join group';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Join Group')),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: _buildContent(),
      ),
    );
  }

  Widget _buildContent() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 48, color: Colors.red),
            const SizedBox(height: 16),
            Text(
              'Error: $_error',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Go Back'),
            ),
          ],
        ),
      );
    }

    if (_inviteDetails != null) {
      final name = _inviteDetails!['group_name'];
      final count = _inviteDetails!['member_count'];

      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            const Icon(Icons.group_add, size: 64, color: Colors.blue),
            const SizedBox(height: 24),
            Text(
              'You have been invited to join',
              style: Theme.of(context).textTheme.bodyLarge,
            ),
            const SizedBox(height: 8),
            Text(
              name,
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              '$count members',
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(height: 48),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: _isJoining ? null : _joinGroup,
                style: ElevatedButton.styleFrom(
                   backgroundColor: Colors.blue,
                   foregroundColor: Colors.white,
                ),
                child: _isJoining
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text('Join Group'),
              ),
            ),
            const SizedBox(height: 16),
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Cancel'),
            ),
          ],
        ),
      );
    }

    return const SizedBox.shrink();
  }
}
