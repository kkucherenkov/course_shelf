import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';

// tests for ScrapedCourseFragmentDto
void main() {
  final instance = ScrapedCourseFragmentDtoBuilder();
  // TODO add properties to the builder and call build()

  group(ScrapedCourseFragmentDto, () {
    // Raw course title as returned by the scraper.
    // String title
    test('to test the property `title`', () async {
      // TODO
    });

    // Raw course description.
    // String description
    test('to test the property `description`', () async {
      // TODO
    });

    // Instructor names as scraped (not resolved to Instructor entities).
    // BuiltList<String> instructorNames
    test('to test the property `instructorNames`', () async {
      // TODO
    });

    // Studio or channel name as scraped (not resolved to a Studio entity).
    // String studioName
    test('to test the property `studioName`', () async {
      // TODO
    });

    // Raw tags or topic labels.
    // BuiltList<String> tags
    test('to test the property `tags`', () async {
      // TODO
    });

    // CourseLevel level
    test('to test the property `level`', () async {
      // TODO
    });

    // BCP-47 language code (e.g. `en`, `de`).
    // String language
    test('to test the property `language`', () async {
      // TODO
    });

    // Original release date of the course in ISO 8601 date format.
    // Date releaseDate
    test('to test the property `releaseDate`', () async {
      // TODO
    });

    // URL of the course thumbnail / poster image.
    // String posterUrl
    test('to test the property `posterUrl`', () async {
      // TODO
    });

    // External system references detected during scraping.
    // BuiltList<ExternalIdRef> externalIds
    test('to test the property `externalIds`', () async {
      // TODO
    });

    // Aggregate rating value in the range [0, 5].
    // double ratingAverage
    test('to test the property `ratingAverage`', () async {
      // TODO
    });

    // Number of ratings that make up the aggregate.
    // int ratingCount
    test('to test the property `ratingCount`', () async {
      // TODO
    });

  });
}
