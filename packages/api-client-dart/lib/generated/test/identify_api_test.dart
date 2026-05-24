import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';


/// tests for IdentifyApi
void main() {
  final instance = AppApiClient().getIdentifyApi();

  group(IdentifyApi, () {
    // Apply a proposed identify task to its course
    //
    // Merges the scraped fragment into the course per the (optionally overridden) merge policy, resolving names to entities. Requires admin role.
    //
    //Future<IdentifyTaskDto> applyIdentifyResult(String id, { ApplyIdentifyRequest applyIdentifyRequest }) async
    test('test applyIdentifyResult', () async {
      // TODO
    });

    // Discard a proposed identify task
    //
    // Marks the task as discarded; no changes are written to the course. Requires admin role.
    //
    //Future<IdentifyTaskDto> discardIdentifyTask(String id) async
    test('test discardIdentifyTask', () async {
      // TODO
    });

    // Get one identify task
    //
    // Returns a single identify task by id. Requires admin role.
    //
    //Future<IdentifyTaskDto> getIdentifyTask(String id) async
    test('test getIdentifyTask', () async {
      // TODO
    });

    // List identify tasks
    //
    // Returns identify tasks ordered newest-first. Optionally filtered by status and/or courseId. Requires admin role.
    //
    //Future<IdentifyTaskListDto> listIdentifyTasks({ IdentifyTaskStatus status, String courseId }) async
    test('test listIdentifyTasks', () async {
      // TODO
    });

    // Create an identify proposal for a course
    //
    // Persists a chosen scraped fragment as a `proposed` IdentifyTask. Nothing is written to the course until the task is applied. Requires admin role.
    //
    //Future<IdentifyTaskDto> runIdentifyTask(String id, RunIdentifyRequest runIdentifyRequest) async
    test('test runIdentifyTask', () async {
      // TODO
    });

  });
}
