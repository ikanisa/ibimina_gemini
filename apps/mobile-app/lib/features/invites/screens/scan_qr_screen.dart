import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:ibimina_mobile/features/invites/services/qr_code_service.dart';
import 'package:go_router/go_router.dart';

class ScanQRScreen extends StatefulWidget {
  const ScanQRScreen({super.key});

  @override
  State<ScanQRScreen> createState() => _ScanQRScreenState();
}

class _ScanQRScreenState extends State<ScanQRScreen> with WidgetsBindingObserver {
  late MobileScannerController controller;
  bool isProcessing = false;

  @override
  void initState() {
    super.initState();
    controller = MobileScannerController(
      detectionSpeed: DetectionSpeed.noDuplicates,
      returnImage: false,
    );
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    controller.dispose();
    super.dispose();
  }

    @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // Re-initialize or stop camera based on lifecycle
    if (!controller.value.isInitialized) return;
    
    switch (state) {
      case AppLifecycleState.resumed:
        controller.start();
        break;
      case AppLifecycleState.inactive:
      case AppLifecycleState.paused:
      case AppLifecycleState.detached:
      case AppLifecycleState.hidden:
        controller.stop();
        break;
    }
  }

  void _handleBarcode(BarcodeCapture capture) {
    if (isProcessing) return;
    
    final barcodes = capture.barcodes;
    if (barcodes.isEmpty) return;

    final rawValue = barcodes.first.rawValue;
    if (rawValue == null || rawValue.isEmpty) return;

    setState(() {
      isProcessing = true;
    });

    // Pause camera scanning while processing
    controller.stop();

    _processCode(rawValue);
  }

  void _processCode(String code) {
    final result = QRCodeService.parse(code);
    final type = result['type'];

    if (type == 'INVITE') {
        final token = result['data']['token'];
        if (token != null) {
             // Navigate to Join Confirmation
             context.push('/join', extra: {'token': token});
        } else {
             _showError('Invalid Invite Code');
        }
    } else if (type == 'CONTRIB') {
        final data = result['data'];
        // Show USSD sheet (Navigate to a route or show dialog)
        // For now, let's assume we have a route or we just show a dialog
        // context.push('/contrib-shortcut', extra: data);
        _showError('Contribution Shortcut Not Implemented Yet: $data'); // Placeholder
        _resumeScanning();
    } else if (type == 'UNSUPPORTED_VERSION') {
        _showError('This QR code version is not supported. Please update your app.');
    } else {
        _showError('Unknown QR Code format.');
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
        duration: const Duration(seconds: 2),
      ),
    );
    // Add a slight delay before resuming to let the user read the error
    Future.delayed(const Duration(seconds: 2), () {
        if (mounted) _resumeScanning();
    });
  }
  
  void _resumeScanning() {
      setState(() {
          isProcessing = false;
      });
      controller.start();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          MobileScanner(
            controller: controller,
            onDetect: _handleBarcode,
            errorBuilder: (context, error, child) {
              return Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.error, color: Colors.white, size: 64),
                    const SizedBox(height: 16),
                    Text(
                      'Camera error: ${error.errorCode}',
                      style: const TextStyle(color: Colors.white),
                    ),
                  ],
                ),
              );
            },
          ),
          
          // Overlay
          SafeArea(
            child: Column(
              children: [
                // Top Bar
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.close, color: Colors.white),
                        onPressed: () => context.pop(),
                      ),
                      ValueListenableBuilder(
                        valueListenable: controller,
                        builder: (context, state, child) {
                           return IconButton(
                            icon: Icon(
                              state.torchState == TorchState.on ? Icons.flash_on : Icons.flash_off,
                              color: Colors.white,
                            ),
                            onPressed: () => controller.toggleTorch(),
                          );
                        },
                      ),
                    ],
                  ),
                ),
                
                const Spacer(),
                
                // Scan Frame Hint
                Container(
                    width: 250,
                    height: 250,
                    decoration: BoxDecoration(
                        border: Border.all(color: Colors.white.withValues(alpha: 0.5), width: 2),
                        borderRadius: BorderRadius.circular(12),
                    ),
                    child: Center(
                         child: Container(width: 230, height: 1, color: Colors.red.withValues(alpha: 0.6)),
                    ),
                ),
                
                const SizedBox(height: 32),
                
                const Text(
                  'Align QR code within the frame',
                  style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w500),
                ),

                const Spacer(),
              ],
            ),
          ),
          
          if (isProcessing)
             Container(
                 color: Colors.black54,
                 child: const Center(child: CircularProgressIndicator()),
             ),
        ],
      ),
    );
  }
}
