import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ibimina_mobile/ui/tokens/colors.dart';
import 'package:ibimina_mobile/features/dashboard/screens/home_tab.dart';
import 'package:ibimina_mobile/features/rewards/screens/rewards_screen.dart';
import 'package:ibimina_mobile/features/settings/screens/settings_screen.dart';
import 'package:go_router/go_router.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  int _selectedIndex = 0;

  final List<Widget> _tabs = [
    const HomeTab(),
    const RewardsScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // Only show AppBar on Home tab, or handle inside tabs?
      // Design choice: HomeTab handles its own header effectively via body content, 
      // but original DashboardScreen had an AppBar.
      // Let's keep a shared AppBar structure if suitable, or let tabs handle it.
      // Original Home has "Hello!" in body, but also an AppBar "Dashboard".
      // RewardsScreen has its own AppBar.
      // So let's conditionally show AppBar or let children handle SCaffolds (nested).
      // Best practice: Shell Scaffold handles BottomNav, children are body.
      // But RewardsScreen has `Scaffold` with AppBar.
      // So DashboardScreen should probably return a defined Scaffold with BottomNav
      // and body as IndexedStack. The tabs should NOT return Scaffolds if possible
      // OR DashboardScreen just swaps the body and bottomNav.
      
      // Let's try to let children define their scaffold if they need specific AppBars.
      // BUT Flutter BottomNavBar usually lives in the parent Scaffold.
      
      // I'll make DashboardScreen the main Scaffold.
      // If HomeTab needs an App Bar, I should move it there or keep it here dynamically.
      // Original DashboardScreen had "Dashboard" title and Settings icon.
      // RewardsScreen has "Rewards & Growth" title.
      // I'll update the AppBar based on index.
      
      appBar: AppBar(
        title: Text(_selectedIndex == 0 ? 'Dashboard' : 'Rewards & Growth'),
        actions: _selectedIndex == 0
            ? [
                IconButton(
                  icon: const Icon(Icons.settings_outlined),
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const SettingsScreen()),
                    );
                  },
                ),
              ]
            : [],
      ),
      body: IndexedStack(
        index: _selectedIndex,
        children: _tabs,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: (index) {
          setState(() {
            _selectedIndex = index;
          });
        },
        selectedItemColor: AppColors.primary,
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            activeIcon: Icon(Icons.home),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.emoji_events_outlined),
            activeIcon: Icon(Icons.emoji_events),
            label: 'Rewards',
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // Navigate to Scan QR
          // Using GoRouter context extension if available, or GoRouter.of(context)
          // But mixin Navigator.push in existing code suggests standard Nav.
          // Let's use GoRouter if possible, but the import suggests standard.
          // Actually context.push works with GoRouter if imported.
          // Let's check imports.
          
          // Assuming context.push('/scan') works via GoRouter helper
          // or Navigator.of(context).push...
          
          // Using GoRouter explicitly
          GoRouter.of(context).push('/scan');
        },
        backgroundColor: AppColors.primary,
        child: const Icon(Icons.qr_code_scanner, color: Colors.black),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
    );
  }
}
