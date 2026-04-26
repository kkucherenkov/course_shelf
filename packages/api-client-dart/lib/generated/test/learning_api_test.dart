import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';


/// tests for LearningApi
void main() {
  final instance = AppApiClient().getLearningApi();

  group(LearningApi, () {
    // Get the requester's progress on a lesson
    //
    // Returns the current progress record for the requesting user on the given lesson. 403 is returned both when the requester has no READ grant covering the lesson **and** when the lesson does not exist — preventing existence leakage. 404 is returned only when the lesson exists but the requester has not yet recorded any progress. 
    //
    //Future<LessonProgressDto> getLessonProgress(String lessonId) async
    test('test getLessonProgress', () async {
      // TODO
    });

    // Record (upsert) the requester's progress on a lesson
    //
    // Last-write-wins on `clientUpdatedAt`: out-of-order writes (older timestamp than the current state) are silently accepted with the prior state echoed back. The first write that crosses 90 % completion sets `completed: true` and stamps `completedAt`; subsequent writes do not re-emit completion. Always returns the post-merge state — clients can use it to detect whether their write was the one that bumped the counter. 
    //
    //Future<LessonProgressDto> recordLessonProgress(RecordProgressRequest recordProgressRequest) async
    test('test recordLessonProgress', () async {
      // TODO
    });

  });
}
