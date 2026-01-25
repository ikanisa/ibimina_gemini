import 'dart:async';
import 'dart:convert';
import 'dart:ui';
import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:telephony/telephony.dart';
import 'package:uuid/uuid.dart';

Future<void> initializeService() async {
  final service = FlutterBackgroundService();

  // Initialize notifications for foreground service
  final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
      FlutterLocalNotificationsPlugin();

  await flutterLocalNotificationsPlugin.resolvePlatformSpecificImplementation<
      AndroidFlutterLocalNotificationsPlugin>()?.createNotificationChannel(
    const AndroidNotificationChannel(
      'sms_gateway_channel',
      'SMS Gateway Service',
      description: 'Running in background to listen for MoMo SMS',
      importance: Importance.low,
    ),
  );

  await service.configure(
    androidConfiguration: AndroidConfiguration(
      onStart: onStart,
      autoStart: true, // Configurable start
      isForegroundMode: true,
      notificationChannelId: 'sms_gateway_channel',
      initialNotificationTitle: 'SMS Gateway Active',
      initialNotificationContent: 'Listening for MoMo transactions...',
      foregroundServiceNotificationId: 888,
    ),
    iosConfiguration: IosConfiguration(
      autoStart: false,
      onForeground: onStart,
    ),
  );
}

// Entry point for background execution
@pragma('vm:entry-point')
void onStart(ServiceInstance service) async {
  DartPluginRegistrant.ensureInitialized();
  
  // Load config
  final prefs = await SharedPreferences.getInstance();
  final supabaseUrl = prefs.getString('supabase_url') ?? '';
  final apiKey = prefs.getString('api_key') ?? '';
  final deviceId = prefs.getString('device_id') ?? const Uuid().v4();
  
  if (!prefs.containsKey('device_id')) {
    await prefs.setString('device_id', deviceId);
  }

  // Listen for SMS
  Telephony.instance.listenIncomingSms(
    onNewMessage: (SmsMessage message) async {
      await _handleSms(message, supabaseUrl, apiKey, deviceId);
    },
    listenInBackground: true,
    onBackgroundMessage: _backgroundMessageHandler,
  );
  
  // Listen for config updates from UI
  service.on('update_config').listen((event) async {
    if (event != null) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('supabase_url', event['supabase_url'] ?? '');
      await prefs.setString('api_key', event['api_key'] ?? '');
      
      service.invoke('config_updated');
    }
  });

  service.on('stopService').listen((event) {
    service.stopSelf();
  });
}

// Top-level background handler required by Telephony
@pragma('vm:entry-point')
Future<void> _backgroundMessageHandler(SmsMessage message) async {
  final prefs = await SharedPreferences.getInstance();
  final supabaseUrl = prefs.getString('supabase_url') ?? '';
  final apiKey = prefs.getString('api_key') ?? '';
  final deviceId = prefs.getString('device_id') ?? 'unknown_device';
  
  await _handleSms(message, supabaseUrl, apiKey, deviceId);
}

Future<void> _handleSms(
  SmsMessage message, 
  String supabaseUrl, 
  String apiKey, 
  String deviceId
) async {
  if (supabaseUrl.isEmpty || apiKey.isEmpty) return;
  
  try {
    // print('Forwarding SMS: ${message.body}'); // Commented out for production
    
    final response = await http.post(
      Uri.parse('$supabaseUrl/functions/v1/sms-ingest'),
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: jsonEncode({
        'device_identifier': deviceId,
        'sender_phone': message.address ?? 'unknown',
        'sms_text': message.body ?? '',
        'received_at': DateTime.fromMillisecondsSinceEpoch(message.date ?? DateTime.now().millisecondsSinceEpoch).toIso8601String(),
        'message_id': '${message.date}_${message.id}',
      }),
    );

    if (response.statusCode >= 200 && response.statusCode < 300) {
      // Success
    } else {
      // Error
    }
  } catch (e) {
    // Error
  }
}
