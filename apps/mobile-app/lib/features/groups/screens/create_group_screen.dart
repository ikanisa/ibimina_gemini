import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:ibimina_mobile/features/groups/models/group_model.dart';
import 'package:ibimina_mobile/features/groups/providers/group_provider.dart';
import 'package:ibimina_mobile/ui/ui.dart';

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
  String _frequency = 'MONTHLY'; // TODO: Make this an Enum/Constant

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
    
    // Retrieve Institution ID safely
    final repo = ref.read(groupRepositoryProvider);
    final institutionId = await repo.getMyInstitutionId();

    if (institutionId == null) {
       if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Error: No Institution Context found.')));
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
    final isLoading = controllerState.isLoading;

    return AppScaffold(
      // AppScaffold handles safe area and background
      appBar: AppBar(title: const Text('Create a Group')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SectionHeader(title: 'Group Details'),
              const SizedBox(height: AppSpacing.md),
              
              AppTextField(
                controller: _nameController,
                label: 'Group Name',
                hint: 'e.g., Family Savings',
                validator: (v) => v == null || v.isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: AppSpacing.md),
              
              AppTextField(
                controller: _descController,
                label: 'Description (Optional)',
                hint: 'What is this group for?',
                maxLines: 3,
              ),
              
              const SizedBox(height: AppSpacing.lg),
              const SectionHeader(title: 'Settings'),
              const SizedBox(height: AppSpacing.md),

              // Group Type Dropdown
              DropdownButtonFormField<GroupType>(
                value: _selectedType,
                decoration: const InputDecoration(
                  labelText: 'Visibility',
                  border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(AppRadius.md))),
                  contentPadding: EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.ms),
                ),
                items: const [
                  DropdownMenuItem(value: GroupType.private, child: Text('Private (Invite Only)')),
                  DropdownMenuItem(value: GroupType.public, child: Text('Public (Searchable)')),
                ],
                onChanged: (v) => setState(() => _selectedType = v!),
              ),
              const SizedBox(height: AppSpacing.md),

              // Contribution Amount
              AppTextField(
                controller: _amountController,
                label: 'Contribution Amount (RWF)',
                hint: '0',
                keyboardType: TextInputType.number,
                validator: (v) {
                  if (v == null || v.isEmpty) return 'Required';
                  final n = int.tryParse(v);
                  if (n == null) return 'Must be a number';
                  if (n > 4000) return 'Max 4,000 RWF via MoMo';
                  return null;
                },
              ),
              const SizedBox(height: AppSpacing.md),

              // Frequency
              DropdownButtonFormField<String>(
                value: _frequency,
                 decoration: const InputDecoration(
                  labelText: 'Contribution Frequency',
                  border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(AppRadius.md))),
                  contentPadding: EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.ms),
                ),
                items: const [
                  DropdownMenuItem(value: 'WEEKLY', child: Text('Weekly')),
                  DropdownMenuItem(value: 'MONTHLY', child: Text('Monthly')),
                  DropdownMenuItem(value: 'FLEXIBLE', child: Text('Flexible')),
                ],
                 onChanged: (v) => setState(() => _frequency = v!),
              ),

              const SizedBox(height: AppSpacing.xl),
              
              // Action Button
              PrimaryButton(
                label: 'Create Group',
                isLoading: isLoading,
                onPressed: _createGroup,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
