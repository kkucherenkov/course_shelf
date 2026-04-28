import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';

// tests for YourWeekDto
void main() {
  final instance = YourWeekDtoBuilder();
  // TODO add properties to the builder and call build()

  group(YourWeekDto, () {
    // Total whole minutes watched by the requester in the window. Computed by summing duration across `LessonProgress` rows whose `updatedAt` falls inside `range`.
    // int minutesWatched
    test('to test the property `minutesWatched`', () async {
      // TODO
    });

    // Number of lessons the requester completed during the window. Counted from `LessonProgress.completedAt`.
    // int lessonsCompleted
    test('to test the property `lessonsCompleted`', () async {
      // TODO
    });

    // DateRange range
    test('to test the property `range`', () async {
      // TODO
    });

  });
}
