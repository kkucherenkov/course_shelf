import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';


/// tests for MaintenanceApi
void main() {
  final instance = AppApiClient().getMaintenanceApi();

  group(MaintenanceApi, () {
    // Trigger a background metadata backfill across the library
    //
    // Enqueues a background job that walks every course in the specified library (or all libraries when `libraryId` is omitted), reads each course's `course.json`, and upserts instructor/studio/tag links and extended fields. Returns 202 immediately with a `jobId`; subscribe to the `maintenance:backfill:{jobId}` Centrifugo channel to track progress. Admin only. 
    //
    //Future<BackfillJobAccepted> startBackfillMetadata({ BackfillMetadataRequest backfillMetadataRequest }) async
    test('test startBackfillMetadata', () async {
      // TODO
    });

  });
}
