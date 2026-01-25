import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:ibimina_mobile/features/auth/services/passcode_service.dart';

class MockSecureStorage implements FlutterSecureStorage {
  final Map<String, String> _storage = {};

  @override
  // ignore: non_constant_identifier_names
  Future<String?> read({
    required String key,
    IOSOptions? iOptions,
    AndroidOptions? aOptions,
    LinuxOptions? lOptions,
    WebOptions? webOptions,
    MacOsOptions? mOptions,
    WindowsOptions? wOptions,
  }) async {
    return _storage[key];
  }

  @override
  // ignore: non_constant_identifier_names
  Future<void> write({
    required String key,
    required String? value,
    IOSOptions? iOptions,
    AndroidOptions? aOptions,
    LinuxOptions? lOptions,
    WebOptions? webOptions,
    MacOsOptions? mOptions,
    WindowsOptions? wOptions,
  }) async {
    if (value != null) {
      _storage[key] = value;
    } else {
      _storage.remove(key);
    }
  }

  @override
  // ignore: non_constant_identifier_names
  Future<void> delete({
    required String key,
    IOSOptions? iOptions,
    AndroidOptions? aOptions,
    LinuxOptions? lOptions,
    WebOptions? webOptions,
    MacOsOptions? mOptions,
    WindowsOptions? wOptions,
  }) async {
    _storage.remove(key);
  }

  @override
  // ignore: non_constant_identifier_names
  Future<void> deleteAll({
    IOSOptions? iOptions,
    AndroidOptions? aOptions,
    LinuxOptions? lOptions,
    WebOptions? webOptions,
    MacOsOptions? mOptions,
    WindowsOptions? wOptions,
  }) async {
    _storage.clear();
  }

  @override
  // ignore: non_constant_identifier_names
  Future<bool> containsKey({
    required String key,
    IOSOptions? iOptions,
    AndroidOptions? aOptions,
    LinuxOptions? lOptions,
    WebOptions? webOptions,
    MacOsOptions? mOptions,
    WindowsOptions? wOptions,
  }) async {
    return _storage.containsKey(key);
  }

  @override
  Future<Map<String, String>> readAll({
    IOSOptions? iOptions,
    AndroidOptions? aOptions,
    LinuxOptions? lOptions,
    WebOptions? webOptions,
    MacOsOptions? mOptions,
    WindowsOptions? wOptions,
  }) async {
    return _storage;
  }

  @override
  Future<bool?> isCupertinoProtectedDataAvailable({IOSOptions? iOptions, MacOsOptions? mOptions}) async => true;

  @override
  Stream<bool> get onCupertinoProtectedDataAvailabilityChanged => const Stream.empty();
  
  @override
  void registerListener({required String key, required ValueChanged<String?> listener}) {}
  
  @override
  void unregisterAllListeners() {}
  
  @override
  void unregisterAllListenersForKey({required String key}) {}
  
  @override
  void unregisterListener({required String key, required ValueChanged<String?> listener}) {}

  @override
  AndroidOptions get aOptions => AndroidOptions.defaultOptions;

  @override
  IOSOptions get iOptions => IOSOptions.defaultOptions;

  @override
  LinuxOptions get lOptions => LinuxOptions.defaultOptions;

  @override
  MacOsOptions get mOptions => MacOsOptions.defaultOptions;

  @override
  WindowsOptions get wOptions => WindowsOptions.defaultOptions;

  @override
  WebOptions get webOptions => WebOptions.defaultOptions;
}

void main() {
  group('PasscodeService', () {
    late PasscodeService passcodeService;
    late MockSecureStorage mockStorage;

    setUp(() {
      mockStorage = MockSecureStorage();
      passcodeService = PasscodeService(storage: mockStorage);
    });

    test('should create and verify correct passcode', () async {
      const strongPin = '1590';
      await passcodeService.createPasscode(strongPin);
      final isValid = await passcodeService.verifyPasscode(strongPin);
      expect(isValid, true);
    });

    test('should reject incorrect passcode', () async {
      const pin = '2580';
      await passcodeService.createPasscode(pin);
      final isValid = await passcodeService.verifyPasscode('0000');
      expect(isValid, false);
    });

    test('should reject weak passcodes', () {
      expect(() => passcodeService.createPasscode('0000'), throwsA(isA<ArgumentError>()));
      expect(() => passcodeService.createPasscode('1234'), throwsA(isA<ArgumentError>()));
      expect(() => passcodeService.createPasscode('4321'), throwsA(isA<ArgumentError>()));
    });

    test('should lock out after max attempts', () async {
      const pin = '2580';
      await passcodeService.createPasscode(pin);

      for (int i = 0; i < 5; i++) {
        await passcodeService.verifyPasscode('1111');
      }

      expect(
        () => passcodeService.verifyPasscode(pin),
        throwsA(isA<PasscodeLockedException>()),
      );
    });
    
    test('should clear passcode', () async {
       const pin = '2580';
       await passcodeService.createPasscode(pin);
       expect(await passcodeService.hasPasscode(), true);
       
       await passcodeService.clearPasscode();
       expect(await passcodeService.hasPasscode(), false);
    });
  });
}
