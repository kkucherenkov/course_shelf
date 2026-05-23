import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';


/// tests for ScrapersApi
void main() {
  final instance = AppApiClient().getScrapersApi();

  group(ScrapersApi, () {
    // List available metadata scrapers
    //
    // Returns the scrapers configured on this instance with the invocation kinds each supports. Requires admin role.
    //
    //Future<ScraperListDto> listScrapers() async
    test('test listScrapers', () async {
      // TODO
    });

    // Preview scraped metadata for a course
    //
    // Runs the selected scraper against the given input and returns candidate metadata fragments. PREVIEW ONLY — nothing is persisted and scraped names are not resolved to existing entities. Requires admin role. 
    //
    //Future<ScrapePreviewResponse> scrapeCoursePreview(String id, ScrapePreviewRequest scrapePreviewRequest) async
    test('test scrapeCoursePreview', () async {
      // TODO
    });

  });
}
