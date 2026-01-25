import 'package:flutter/material.dart';
import '../../../../ui/tokens/colors.dart';

class ServiceStatusWidget extends StatelessWidget {
  final bool isOperational;

  const ServiceStatusWidget({super.key, this.isOperational = true});

  @override
  Widget build(BuildContext context) {
    // TODO: Connect to remote config for remote status
    // final isOperational = true;
    const errorMessage = 'Some systems are experiencing delays.';

    final isDark = Theme.of(context).brightness == Brightness.dark;
    final titleColor = isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary;
    final bodyColor = isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: isOperational 
            ? AppColors.success.withValues(alpha: 0.1) 
            : AppColors.warning.withValues(alpha: 0.1),
        border: Border(
           bottom: BorderSide(
             color: isOperational 
                 ? AppColors.success.withValues(alpha: 0.2) 
                 : AppColors.warning.withValues(alpha: 0.2),
           ),
        ),
      ),
      child: Row(
        children: [
          Icon(
            isOperational ? Icons.check_circle_outline : Icons.warning_amber_rounded,
            color: isOperational ? AppColors.success : AppColors.warning,
            size: 20,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Service Status',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: titleColor,
                        fontWeight: FontWeight.bold,
                      ),
                ),
                Text(
                  isOperational ? 'All systems operational' : errorMessage,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: bodyColor,
                      ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
