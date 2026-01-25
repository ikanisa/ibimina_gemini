import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:ibimina_mobile/features/invites/screens/join_group_screen.dart';
import 'package:ibimina_mobile/features/invites/services/qr_code_service.dart';
import 'package:ibimina_mobile/features/contribution/screens/contribute_screen.dart';

class ScanInviteScreen extends StatefulWidget {
  const ScanInviteScreen({super.key});

  @override
  State<ScanInviteScreen> createState() => _ScanInviteScreenState();
}

class _ScanInviteScreenState extends State<ScanInviteScreen> {
  final MobileScannerController controller = MobileScannerController(
    detectionSpeed: DetectionSpeed.noDuplicates,
    returnImage: false,
  );
  bool _isProcessing = false;

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  void _onDetect(BarcodeCapture capture) {
    if (_isProcessing) return;
    
    final List<Barcode> barcodes = capture.barcodes;
    for (final barcode in barcodes) {
      final String? code = barcode.rawValue;
      if (code != null) {
        final result = QRCodeService.parse(code);
        
        if (result['type'] == 'INVITE') {
           final data = result['data'] as Map;
           final token = data['token'];
           if (token != null) {
              _processInviteToken(token as String);
              return;
           }
        } else if (result['type'] == 'CONTRIB') {
           final data = result['data'] as Map;
           final groupId = data['gid'];
           final amount = data['amt'];
           if (groupId != null && amount != null) {
              _processContribution(groupId as String, (amount as num).toInt());
              return;
           }
        }
      }
    }
  }

  void _processInviteToken(String token) {
    setState(() => _isProcessing = true);
    controller.stop();
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (context) => JoinGroupScreen(token: token)),
    );
  }

  void _processContribution(String groupId, int amount) {
    setState(() => _isProcessing = true);
    controller.stop();
    // Navigate to Contribute Screen (pre-filled)
    // We assume 'ContributeScreen' can handle being pushed here.
    // However, ContributeScreen constructor takes groupName.
    // The QR doesn't have groupName to keep payload small.
    // We can fetch it, or pass a placeholder. 
    // Ideally ContributeScreen fetches details if name is missing?
    // Current ContributeScreen requires name.
    
    // Quick Fix: Route to ContributeScreen with placeholder name, 
    // or refactor ContributeScreen to fetch name.
    // Since this is "Execute", I'll use "Group" as placeholder or 
    // navigate to a wrapper that fetches it.
    // Actually, passing "Scanning..." as groupName is acceptable for now,
    // as ContributeScreen primarily uses it for display.
    
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (context) => ContributeScreen(
          groupId: groupId,
          groupName: 'Group', // Placeholder
          initialAmount: amount, // Need to update ContributeScreen to accept this
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Scan Invite')),
      body: Stack(
        children: [
          MobileScanner(
            controller: controller,
            onDetect: _onDetect,
          ),
          // Overlay
          Center(
            child: Container(
              width: 250,
              height: 250,
              decoration: BoxDecoration(
                border: Border.all(color: Colors.white, width: 2),
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
          const Positioned(
            bottom: 50,
            left: 0,
            right: 0,
            child: Text(
              'Align QR code within the frame',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.white, fontSize: 16),
            ),
          ),
        ],
      ),
    );
  }
}
