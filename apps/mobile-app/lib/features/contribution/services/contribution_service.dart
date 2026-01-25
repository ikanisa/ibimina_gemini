import 'dart:io';
import 'dart:typed_data';
import 'package:image_picker/image_picker.dart';
import 'package:image/image.dart' as img;
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:ibimina_mobile/core/services/supabase_service.dart';
import 'package:ibimina_mobile/core/utils/logger.dart';
import 'package:ibimina_mobile/features/momo/services/momo_service.dart';
import 'package:ibimina_mobile/features/ledger/services/ledger_service.dart';
import 'package:path/path.dart' as path;

class ContributionService {
  final MoMoService _momoService;
  final LedgerService _ledgerService;
  final ImagePicker _imagePicker;

  ContributionService({
    MoMoService? momoService,
    LedgerService? ledgerService,
    ImagePicker? imagePicker,
  })  : _momoService = momoService ?? MoMoService(),
        _ledgerService = ledgerService ?? LedgerService(),
        _imagePicker = imagePicker ?? ImagePicker();

  /// Maximum contribution amount in RWF.
  static const int maxAmount = 4000;

  /// Maximum file size in bytes (5 MB).
  static const int maxFileSizeBytes = 5 * 1024 * 1024;

  /// Allowed file extensions for proof images.
  static const List<String> allowedExtensions = ['jpg', 'jpeg', 'png'];

  /// Debounce tracker for submission (prevents double-tap)
  DateTime? _lastSubmissionTime;
  static const Duration _submissionDebounce = Duration(seconds: 3);

  /// Validate contribution amount.
  String? validateAmount(int amount) {
    if (amount <= 0) {
      return 'Amount must be greater than 0';
    }
    if (amount > maxAmount) {
      return 'Maximum contribution is 4,000 RWF';
    }
    return null;
  }

  /// Check if current user is a member of the group.
  Future<bool> checkGroupMembership(String groupId) async {
    final user = supabase.auth.currentUser;
    if (user == null) return false;

    try {
      // 1. Get Member ID
      final memberRes = await supabase
          .from('members')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
      
      if (memberRes == null) return false;
      final memberId = memberRes['id'] as String;

      // 2. Check Group Membership
      final response = await supabase
          .from('group_members')
          .select()
          .eq('group_id', groupId)
          .eq('member_id', memberId)
          .eq('status', 'GOOD_STANDING')
          .maybeSingle();
      
      return response != null;
    } catch (e) {
      AppLogger.error('Group membership check failed', error: e, tag: 'Contribution');
      return false;
    }
  }

  /// Launch MoMo USSD for contribution.
  /// Returns the USSD code that was launched.
  Future<String> launchMoMoUssd(int amount) async {
    final ussdCode = '*182*1*1*$amount#';
    await _momoService.launchUssd(ussdCode);
    return ussdCode;
  }

  /// Pick proof image from camera or gallery.
  /// Returns null if user cancels or file is invalid.
  Future<File?> pickProofImage({required bool fromCamera}) async {
    final source = fromCamera ? ImageSource.camera : ImageSource.gallery;
    final picked = await _imagePicker.pickImage(
      source: source,
      maxWidth: 1200,
      maxHeight: 1200,
      imageQuality: 80,
    );
    if (picked == null) return null;

    final file = File(picked.path);

    // Validate file type
    final extension = path.extension(picked.path).toLowerCase().replaceAll('.', '');
    if (!allowedExtensions.contains(extension)) {
      AppLogger.warn('Invalid file type rejected: $extension', tag: 'Contribution');
      throw const FormatException('Only JPEG and PNG images are allowed');
    }

    // Validate file size
    final fileSize = await file.length();
    if (fileSize > maxFileSizeBytes) {
      AppLogger.warn('File too large: ${fileSize ~/ 1024}KB', tag: 'Contribution');
      throw const FormatException('File size must be less than 5 MB');
    }

    return file;
  }

  /// Validate proof file before upload.
  /// Returns error message if invalid, null if valid.
  String? validateProofFile(File file) {
    final extension = path.extension(file.path).toLowerCase().replaceAll('.', '');
    if (!allowedExtensions.contains(extension)) {
      return 'Only JPEG and PNG images are allowed';
    }
    return null;
  }

  /// Upload proof image to Supabase Storage.
  /// Strips EXIF metadata before uploading.
  /// Returns the signed URL of the uploaded image.
  Future<String> uploadProof(File file, String groupId) async {
    final userId = supabase.auth.currentUser?.id;
    if (userId == null) {
      throw Exception('User must be authenticated to upload proof');
    }

    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final fileName = '$userId/$groupId/$timestamp.jpg';

    // Strip EXIF metadata by re-encoding the image
    final cleanedBytes = await _stripExifMetadata(file);

    await supabase.storage.from('contribution-proofs').uploadBinary(
          fileName,
          cleanedBytes,
          fileOptions: const FileOptions(contentType: 'image/jpeg'),
        );

    // Use signed URL instead of public URL for better access control
    final signedUrl = await supabase.storage
        .from('contribution-proofs')
        .createSignedUrl(fileName, 60 * 60 * 24 * 7); // 7 days

    AppLogger.debug('Proof uploaded successfully', tag: 'Contribution');
    return signedUrl;
  }

  /// Strip EXIF metadata from image by re-encoding.
  /// This removes GPS coordinates, device info, and other metadata.
  Future<Uint8List> _stripExifMetadata(File file) async {
    try {
      final bytes = await file.readAsBytes();
      final image = img.decodeImage(bytes);
      
      if (image == null) {
        // If decoding fails, return original bytes (fail-open for UX)
        AppLogger.warn('Image decode failed, using original', tag: 'Contribution');
        return bytes;
      }

      // Re-encode as JPEG without EXIF
      // The image package doesn't preserve EXIF when encoding
      final cleanBytes = img.encodeJpg(image, quality: 85);
      return Uint8List.fromList(cleanBytes);
    } catch (e) {
      AppLogger.error('EXIF stripping failed', error: e, tag: 'Contribution');
      // Return original bytes if stripping fails
      return await file.readAsBytes();
    }
  }

  /// Validate wallet cap (max 500,000 RWF).
  Future<String?> validateWalletCap(String groupId, int newAmount) async {
    try {
      final transactions = await _ledgerService.getGroupTransactions(groupId);
      final currentBalance = transactions
          .where((t) => t.status == 'confirmed' && t.type == 'deposit')
          .fold(0.0, (sum, t) => sum + t.amount);

      if (currentBalance + newAmount > 500000) {
        return 'Wallet limit reached (Max 500,000 RWF)';
      }
      return null;
    } catch (e) {
      AppLogger.error('Wallet cap validation failed', error: e, tag: 'Contribution');
      return 'Could not verify wallet balance. Please try again.';
    }
  }

  /// Check if submission is being rate-limited (client-side debounce).
  bool isSubmissionDebounced() {
    if (_lastSubmissionTime == null) return false;
    return DateTime.now().difference(_lastSubmissionTime!) < _submissionDebounce;
  }

  /// Record a pending contribution in the ledger.
  /// Includes client-side debounce to prevent double-tap submissions.
  Future<void> recordPendingContribution({
    required String groupId,
    required int amount,
    String? proofUrl,
    String? transactionId,
  }) async {
    // Client-side debounce
    if (isSubmissionDebounced()) {
      AppLogger.warn('Submission debounced (double-tap prevention)', tag: 'Contribution');
      throw Exception('Please wait before submitting again');
    }
    _lastSubmissionTime = DateTime.now();

    await _ledgerService.recordPendingTransaction(
      groupId: groupId,
      amount: amount,
      proofUrl: proofUrl,
      transactionId: transactionId,
    );
    
    AppLogger.debug('Contribution recorded successfully', tag: 'Contribution');
  }
}

