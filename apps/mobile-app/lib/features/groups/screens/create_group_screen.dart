import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:ibimina_mobile/features/groups/models/group_model.dart';
import 'package:ibimina_mobile/features/groups/providers/group_provider.dart';

class CreateGroupScreen extends ConsumerStatefulWidget {
  const CreateGroupScreen({super.key});

  @override
  ConsumerState<CreateGroupScreen> createState() => _CreateGroupScreenState();
}

class _CreateGroupScreenState extends ConsumerState<CreateGroupScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _descController = TextEditingController();
  final _amountController = TextEditingController();
  
  GroupType _selectedType = GroupType.private;
  String _frequency = 'MONTHLY';

  @override
  void initState() {
    super.initState();
    // Check if user is already a member
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final membership = ref.read(myMembershipProvider).asData?.value;
      if (membership != null && membership.isActive) {
        if (mounted) {
           ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('You are already in a group.')));
           context.go('/group/view');
        }
      }
    });
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descController.dispose();
    _amountController.dispose();
    super.dispose();
  }

  Future<void> _createGroup() async {
    if (!_formKey.currentState!.validate()) return;
    
    // We need institutionId. 
    // Ideally controller handles retrieving it or passing it?
    // The repo requires institutionId explicitly.
    // Let's rely on the repository's internal helper or pass it.
    // The controller calls repository.createGroup which takes institutionId.
    // Wait, the controller provided earlier calls `repository.createGroup` but passes `institutionId` parameter.
    // The view doesn't know institutionId easily without fetching it.
    // We should probably update the Controller to fetch it if not provided or make repo fetch it.
    // Let's fetch it here for now or update provider.
    // Actually, `myMembershipProvider` fetches it. We could use `groupRepositoryProvider` to get it.
    
    final repo = ref.read(groupRepositoryProvider);
    final institutionId = await repo.getMyInstitutionId();

    if (institutionId == null) {
       if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Error: No Institution ID found.')));
       return;
    }

    try {
      final amount = int.tryParse(_amountController.text) ?? 0;
      await ref.read(groupControllerProvider.notifier).createGroup(
        name: _nameController.text,
        institutionId: institutionId,
        description: _descController.text,
        type: _selectedType,
        contributionAmount: amount,
        frequency: _frequency,
      );
      if (mounted) context.go('/group/view');
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to create: ${e.toString()}')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final controllerState = ref.watch(groupControllerProvider);
    
    return Scaffold(
      appBar: AppBar(title: const Text('Create a Group')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(labelText: 'Group Name', border: OutlineInputBorder()),
                validator: (v) => v == null || v.isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _descController,
                decoration: const InputDecoration(labelText: 'Description', border: OutlineInputBorder()),
                maxLines: 3,
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<GroupType>(
                value: _selectedType,
                decoration: const InputDecoration(labelText: 'Group Type', border: OutlineInputBorder()),
                items: const [
                  DropdownMenuItem(value: GroupType.private, child: Text('Private (Invite Only)')),
                  DropdownMenuItem(value: GroupType.public, child: Text('Public (Searchable)')),
                ],
                onChanged: (v) => setState(() => _selectedType = v!),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _amountController,
                decoration: const InputDecoration(labelText: 'Contribution Amount (RWF)', border: OutlineInputBorder()),
                keyboardType: TextInputType.number,
                 validator: (v) {
                  if (v == null || v.isEmpty) return 'Required';
                  final n = int.tryParse(v);
                  if (n == null) return 'Must be a number';
                  if (n > 4000) return 'Max 4,000 RWF';
                  return null;
                },
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _frequency,
                decoration: const InputDecoration(labelText: 'Contribution Frequency', border: OutlineInputBorder()),
                items: const [
                  DropdownMenuItem(value: 'WEEKLY', child: Text('Weekly')),
                  DropdownMenuItem(value: 'MONTHLY', child: Text('Monthly')),
                  DropdownMenuItem(value: 'FLEXIBLE', child: Text('Flexible')),
                ],
                 onChanged: (v) => setState(() => _frequency = v!),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: controllerState.isLoading ? null : _createGroup,
                child: controllerState.isLoading 
                    ? const CircularProgressIndicator() 
                    : const Text('Create Group'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
