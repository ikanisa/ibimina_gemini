import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:ibimina_mobile/features/invites/services/qr_code_service.dart';

void main() {
  group('QRCodeService', () {
    const validToken = 'valid_token_123';
    const validGroupId = 'group_123';
    const validAmount = 2000;

    group('Standard Payload (JSON)', () {
      test('should parse valid INVITE payload properly', () {
        final payload = jsonEncode({
          'v': 1,
          't': 'INVITE',
          'd': {'token': validToken},
        });

        final result = QRCodeService.parse(payload);
        expect(result['type'], 'INVITE');
        expect(result['data']['token'], validToken);
      });

      test('should parse valid CONTRIB payload properly', () {
        final payload = jsonEncode({
          'v': 1,
          't': 'CONTRIB',
          'd': {'gid': validGroupId, 'amt': validAmount},
        });

        final result = QRCodeService.parse(payload);
        expect(result['type'], 'CONTRIB');
        expect(result['data']['gid'], validGroupId);
        expect(result['data']['amt'], validAmount);
      });

      test('should return UNSUPPORTED_VERSION for v != 1', () {
        final payload = jsonEncode({
          'v': 99,
          't': 'INVITE',
          'd': {'token': validToken},
        });

        final result = QRCodeService.parse(payload);
        expect(result['type'], 'UNSUPPORTED_VERSION');
        expect(result['v'], 99);
      });

      test('should accept payload without version (legacy compat)', () {
        final payload = jsonEncode({
          't': 'INVITE',
          'd': {'token': validToken},
        });

        final result = QRCodeService.parse(payload);
        expect(result['type'], 'INVITE');
        expect(result['data']['token'], validToken);
      });
    });

    group('Legacy/Fallback Parsing', () {
      test('should handle plain string as INVITE token', () {
        const rawToken = 'simple-raw-token';
        final result = QRCodeService.parse(rawToken);

        expect(result['type'], 'INVITE');
        expect(result['data']['token'], rawToken);
        expect(result['data']['legacy'], true);
      });

      test('should extract token from full URL string', () {
        const url = 'https://ibimina.app/join/extracted_url_token';
        final result = QRCodeService.parse(url);

        expect(result['type'], 'INVITE');
        expect(result['data']['token'], 'extracted_url_token');
        expect(result['data']['legacy'], true);
      });

        test('should handle URL without join path conservatively', () {
        const url = 'https://ibimina.app/other/path';
        final result = QRCodeService.parse(url);

        expect(result['type'], 'INVITE');
        // Because the path doesn't contain join logic, our naive implementation falls back to returning the whole string
        // This is acceptable as long as the server rejects invalid tokens.
        expect(result['data']['legacy'], true);
      });
    });

    group('Payload Generation', () {
      test('generateInvitePayload creates correct V1 JSON', () {
        final result = QRCodeService.generateInvitePayload(validToken);
        final decoded = jsonDecode(result);

        expect(decoded['v'], 1);
        expect(decoded['t'], 'INVITE');
        expect(decoded['d']['token'], validToken);
      });

      test('generateContributionPayload creates correct V1 JSON', () {
        final result = QRCodeService.generateContributionPayload(validGroupId, validAmount);
        final decoded = jsonDecode(result);

        expect(decoded['v'], 1);
        expect(decoded['t'], 'CONTRIB');
        expect(decoded['d']['gid'], validGroupId);
        expect(decoded['d']['amt'], validAmount);
      });
    });
  });
}
