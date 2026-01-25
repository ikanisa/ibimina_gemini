import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_background_service/flutter_background_service.dart';
import 'services/background_service.dart'; // Import background service logic

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const SmsGatewayApp());
}

class SmsGatewayApp extends StatelessWidget {
  const SmsGatewayApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'MoMo SMS Gateway',
      theme: ThemeData(
        primarySwatch: Colors.green,
        useMaterial3: true,
      ),
      home: const DashboardScreen(),
    );
  }
}

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final _urlController = TextEditingController();
  final _keyController = TextEditingController();
  bool _isServiceRunning = false;
  String _status = 'Initializing...';
  String _deviceId = 'Loading...';

  @override
  void initState() {
    super.initState();
    _loadConfig();
    _checkPermissions();
  }

  Future<void> _loadConfig() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _urlController.text = prefs.getString('supabase_url') ?? '';
      _keyController.text = prefs.getString('api_key') ?? '';
      _deviceId = prefs.getString('device_id') ?? 'Not Set';
    });
    
    final service = FlutterBackgroundService();
    bool isRunning = await service.isRunning();
    setState(() {
      _isServiceRunning = isRunning;
      _status = isRunning ? 'Service Running' : 'Service Stopped';
    });
  }

  Future<void> _checkPermissions() async {
    Map<Permission, PermissionStatus> statuses = await [
      Permission.sms,
      Permission.notification,
    ].request();

    if (statuses[Permission.sms]!.isDenied) {
      setState(() => _status = 'SMS Permission Denied');
    }
  }

  Future<void> _saveConfig() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('supabase_url', _urlController.text);
    await prefs.setString('api_key', _keyController.text);
    
    setState(() => _status = 'Config Saved');
    
    if (_isServiceRunning) {
      FlutterBackgroundService().invoke('update_config', {
        'supabase_url': _urlController.text,
        'api_key': _keyController.text,
      });
    }
  }

  Future<void> _toggleService() async {
    final service = FlutterBackgroundService();
    var isRunning = await service.isRunning();
    
    if (isRunning) {
      service.invoke("stop"); // Custom stop event if needed, or allow OS to kill
      // Note: flutter_background_service autoStart=true makes it hard to kill persistence.
      // Usually better to just update config or pause logic.
      setState(() {
        _isServiceRunning = true; // It restarts automatically usually
        _status = 'Service is persistent';
      });
    } else {
      await initializeService();
      await service.startService();
      setState(() {
        _isServiceRunning = true;
        _status = 'Service Started';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('MoMo SMS Gateway')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildStatusCard(),
            const SizedBox(height: 20),
            _buildConfigSection(),
            const SizedBox(height: 20),
            _buildInstructions(),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusCard() {
    return Card(
      color: _isServiceRunning ? Colors.green.shade100 : Colors.red.shade100,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            Text('Status: $_status', style: const TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 10),
            Text('Device ID: $_deviceId'),
            const SizedBox(height: 10),
            ElevatedButton(
              onPressed: _toggleService, 
              child: Text(_isServiceRunning ? 'Restart Service' : 'Start Service')
            )
          ],
        ),
      ),
    );
  }

  Widget _buildConfigSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Configuration', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            TextField(
              controller: _urlController,
              decoration: const InputDecoration(labelText: 'Supabase URL'),
            ),
            TextField(
              controller: _keyController,
              decoration: const InputDecoration(labelText: 'Ingest API Key'),
              obscureText: true,
            ),
            const SizedBox(height: 10),
            ElevatedButton(
              onPressed: _saveConfig,
              child: const Text('Save Configuration'),
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildInstructions() {
    return const Text(
      'Instructions:\n'
      '1. Enter your Supabase Project URL and SMS_INGEST_API_KEY.\n'
      '2. Grant SMS permissions when prompted.\n'
      '3. Click Start Service.\n'
      '4. Keep this app installed on the collection phone.\n\n'
      'The service runs in the background and forwards incoming SMS to the cloud.',
      style: TextStyle(color: Colors.grey),
    );
  }
}
