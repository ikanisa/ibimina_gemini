import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../tokens/spacing.dart';

/// Standard scaffold wrapper with consistent padding and safe area.
/// 
/// Usage:
/// ```dart
/// AppScaffold(
///   appBar: AppBar(title: Text('Title')),
///   body: Column(...),
/// )
/// ```
class AppScaffold extends StatelessWidget {
  const AppScaffold({
    super.key,
    required this.body,
    this.appBar,
    this.bottomNavigationBar,
    this.floatingActionButton,
    this.floatingActionButtonLocation,
    this.backgroundColor,
    this.padding,
    this.useSafeArea = true,
  });

  final Widget body;
  final PreferredSizeWidget? appBar;
  final Widget? bottomNavigationBar;
  final Widget? floatingActionButton;
  final FloatingActionButtonLocation? floatingActionButtonLocation;
  final Color? backgroundColor;
  final EdgeInsets? padding;
  final bool useSafeArea;

  @override
  Widget build(BuildContext context) {
    Widget content = Padding(
      padding: padding ?? const EdgeInsets.symmetric(horizontal: AppSpacing.screenPadding),
      child: body,
    );

    if (useSafeArea) {
      content = SafeArea(
        bottom: bottomNavigationBar == null,
        child: content,
      );
    }

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: Theme.of(context).brightness == Brightness.dark
          ? SystemUiOverlayStyle.light
          : SystemUiOverlayStyle.dark,
      child: Scaffold(
        backgroundColor: backgroundColor,
        appBar: appBar,
        body: content,
        bottomNavigationBar: bottomNavigationBar,
        floatingActionButton: floatingActionButton,
        floatingActionButtonLocation: floatingActionButtonLocation,
      ),
    );
  }
}
