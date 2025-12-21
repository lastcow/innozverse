import 'dart:convert';
import 'package:http/http.dart' as http;

class HealthResponse {
  final String status;
  final String timestamp;
  final String version;

  HealthResponse({
    required this.status,
    required this.timestamp,
    required this.version,
  });

  factory HealthResponse.fromJson(Map<String, dynamic> json) {
    return HealthResponse(
      status: json['status'] as String,
      timestamp: json['timestamp'] as String,
      version: json['version'] as String,
    );
  }
}

class ApiService {
  final String baseUrl;

  ApiService({required this.baseUrl});

  Future<HealthResponse> getHealth() async {
    final uri = Uri.parse('$baseUrl/health');
    
    try {
      final response = await http.get(uri);

      if (response.statusCode == 200) {
        final json = jsonDecode(response.body) as Map<String, dynamic>;
        return HealthResponse.fromJson(json);
      } else {
        throw Exception('Failed to get health: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('API request failed: $e');
    }
  }
}
