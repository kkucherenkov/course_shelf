import 'dart:io' show Platform;

import 'package:flutter/foundation.dart';

class AppConfig {
  const AppConfig({required this.apiBaseUrl, required this.authBaseUrl});

  factory AppConfig.fromEnv() {
    const apiOverride = String.fromEnvironment('API_BASE_URL');
    const authOverride = String.fromEnvironment('AUTH_BASE_URL');

    final host = _defaultHost();
    return AppConfig(
      apiBaseUrl: apiOverride.isNotEmpty
          ? apiOverride
          : 'http://$host:3000/api/v1',
      authBaseUrl: authOverride.isNotEmpty ? authOverride : 'http://$host:3000',
    );
  }

  final String apiBaseUrl;
  final String authBaseUrl;

  static String _defaultHost() {
    if (kIsWeb) return 'localhost';
    if (Platform.isAndroid) return '10.0.2.2';
    return 'localhost';
  }
}
