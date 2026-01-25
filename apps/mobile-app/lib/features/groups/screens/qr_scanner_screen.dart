import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:ibimina_mobile/ui/tokens/colors.dart';

class QRScannerScreen extends StatefulWidget {
  const QRScannerScreen({super.key});

  @override
  State<QRScannerScreen> createState() => _QRScannerScreenState();
}

class _QRScannerScreenState extends State<QRScannerScreen> {
  final MobileScannerController _controller = MobileScannerController();
  bool _hasDetected = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _onDetect(BarcodeCapture capture) {
    if (_hasDetected) return;
    final List<Barcode> barcodes = capture.barcodes;
    
    for (final barcode in barcodes) {
      if (barcode.rawValue != null) {
        _hasDetected = true;
        Navigator.of(context).pop(barcode.rawValue);
        break;
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Scan Invite Code'),
        actions: [
          IconButton(
            icon: ValueListenableBuilder(
              valueListenable: _controller,
              builder: (context, state, child) {
                switch (state.torchState) {
                  case TorchState.off:
                    return const Icon(Icons.flash_off, color: Colors.grey);
                  case TorchState.on:
                    return const Icon(Icons.flash_on, color: Colors.yellow);
                  case TorchState.auto:
                    return const Icon(Icons.flash_auto, color: Colors.white);
                  case TorchState.unavailable:
                    return const Icon(Icons.flash_off, color: Colors.grey);
                }
              },
            ),
            onPressed: () => _controller.toggleTorch(),
          ),
          IconButton(
            icon: ValueListenableBuilder(
              valueListenable: _controller,
              builder: (context, state, child) {
                switch (state.cameraDirection) {
                  case CameraFacing.front:
                    return const Icon(Icons.camera_front);
                  case CameraFacing.back:
                    return const Icon(Icons.camera_rear);
                }
              },
            ),
            onPressed: () => _controller.switchCamera(),
          ),
        ],
      ),
      body: Stack(
        children: [
          MobileScanner(
            controller: _controller,
            onDetect: _onDetect,
            errorBuilder: (context, error, child) {
              return Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.error_outline,
                      color: AppColors.error,
                      size: 48,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Camera error: ${error.errorCode}',
                      style: const TextStyle(color: AppColors.textPrimary),
                    ),
                    const SizedBox(height: 8),
                    const Text('Check permissions in settings'),
                  ],
                ),
              );
            },
          ),
          // Overlay
          Container(
            decoration: ShapeDecoration(
              shape: QrScannerOverlayShape(
                borderColor: AppColors.primary,
                borderRadius: 10,
                borderLength: 30,
                borderWidth: 10,
                cutOutSize: 300,
              ),
            ),
          ),
          Positioned(
            bottom: 40,
            left: 0,
            right: 0,
            child: const Center(
              child: Text(
                'Scan the QR code to join a group',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                  shadows: [
                    Shadow(
                      color: Colors.black54,
                      offset: Offset(0, 2),
                      blurRadius: 4,
                    )
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// Custom painter helper for overlay (if not using a package for it, but here using ShapeDecoration with a ClipPath logic is complex so I'll create a simple overlay class or assume one exists? 
// Actually, I can just use a simple Container with a Hole if need be, BUT usually there is a scanner_overlay package. 
// I'll implement a simple QrScannerOverlayShape class here to avoid external deps if mobile_scanner doesn't provide one (older versions did, v5 might not).
// Wait, mobile_scanner usually implies just the scanner. Let's write a simple overlay painter to be safe.)

class QrScannerOverlayShape extends ShapeBorder {
  final Color borderColor;
  final double borderWidth;
  final Color overlayColor;
  final double borderRadius;
  final double borderLength;
  final double cutOutSize;

  QrScannerOverlayShape({
    this.borderColor = Colors.red,
    this.borderWidth = 10.0,
    this.overlayColor = const Color.fromRGBO(0, 0, 0, 80),
    this.borderRadius = 10,
    this.borderLength = 40,
    this.cutOutSize = 250,
  });

  @override
  EdgeInsetsGeometry get dimensions => EdgeInsets.zero;

  @override
  Path getInnerPath(Rect rect, {TextDirection? textDirection}) {
    return Path()
      ..fillType = PathFillType.evenOdd
      ..addPath(getOuterPath(rect), Offset.zero);
  }

  @override
  Path getOuterPath(Rect rect, {TextDirection? textDirection}) {
    Path getLeftTopPath(Rect rect) {
      return Path()
        ..moveTo(rect.left, rect.bottom)
        ..lineTo(rect.left, rect.top)
        ..lineTo(rect.right, rect.top);
    }

    return getLeftTopPath(rect);
  }

  @override
  void paint(Canvas canvas, Rect rect, {TextDirection? textDirection}) {
    final width = rect.width;
    final borderWidthSize = width / 2;
    final height = rect.height;
    final borderOffset = borderWidth / 2;
    final _cutOutSize = cutOutSize;
    final _cutOutRect = Rect.fromLTWH(
      rect.left + width / 2 - _cutOutSize / 2 + borderOffset,
      rect.top + height / 2 - _cutOutSize / 2 + borderOffset,
      _cutOutSize - borderWidth,
      _cutOutSize - borderWidth,
    );

    final backgroundPaint = Paint()
      ..color = overlayColor
      ..style = PaintingStyle.fill;

    final borderPaint = Paint()
      ..color = borderColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = borderWidth;

    final boxPaint = Paint()
      ..color = borderColor
      ..style = PaintingStyle.fill;

    final cutOutPath = Path()
      ..addRRect(
        RRect.fromRectAndRadius(
          _cutOutRect,
          Radius.circular(borderRadius),
        ),
      );

    final backgroundPath = Path()
      ..addRect(rect)
      ..addPath(cutOutPath, Offset.zero)
      ..fillType = PathFillType.evenOdd;

    canvas.drawPath(backgroundPath, backgroundPaint);
    
    // Draw corners
    final r = _cutOutRect;
    final len = borderLength;

    // TL
    canvas.drawLine(r.topLeft, r.topLeft.translate(0, len), borderPaint);
    canvas.drawLine(r.topLeft, r.topLeft.translate(len, 0), borderPaint);
    
    // TR
    canvas.drawLine(r.topRight, r.topRight.translate(0, len), borderPaint);
    canvas.drawLine(r.topRight, r.topRight.translate(-len, 0), borderPaint);

    // BL
    canvas.drawLine(r.bottomLeft, r.bottomLeft.translate(0, -len), borderPaint);
    canvas.drawLine(r.bottomLeft, r.bottomLeft.translate(len, 0), borderPaint);

    // BR
    canvas.drawLine(r.bottomRight, r.bottomRight.translate(0, -len), borderPaint);
    canvas.drawLine(r.bottomRight, r.bottomRight.translate(-len, 0), borderPaint);
  }

  @override
  ShapeBorder scale(double t) {
    return QrScannerOverlayShape(
      borderColor: borderColor,
      borderWidth: borderWidth * t,
      overlayColor: overlayColor,
      borderRadius: borderRadius * t,
      borderLength: borderLength * t,
      cutOutSize: cutOutSize * t,
    );
  }
}
