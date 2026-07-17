import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';


/// tests for CatalogApi
void main() {
  final instance = AppApiClient().getCatalogApi();

  group(CatalogApi, () {
    // List courses the requester is in the middle of
    //
    // Returns the requester's courses ordered by recency (most-recently-watched first), capped by `limit`. Reads from a denormalised `CourseProgressReadModel` projection that's updated by `LessonCompleted` and `LessonProgressRecorded` events. Empty array for new users. 
    //
    //Future<ContinueWatchingDto> getContinueWatching({ int limit }) async
    test('test getContinueWatching', () async {
      // TODO
    });

    // Get a single course
    //
    // Returns the full CourseDto for one course by its server-generated cuid. Non-admins must hold a READ AccessGrant on the course's library.
    //
    //Future<CourseDto> getCourse(String id) async
    test('test getCourse', () async {
      // TODO
    });

    // Full course outline — sections, lessons (lite), and aggregated materials
    //
    // Single round-trip endpoint feeding the Course detail page. Returns the course summary, every section with its lesson list (lightweight: title, duration, hasMaterials, per-user progress), and a flat list of course-level materials aggregated across all lessons. The dedicated outline avoids N+1 page fetches and never returns full LessonDtos (which would inflate the payload with subtitle tracks the page does not render).  Reads `Course` + `Section` + `Lesson` + `Material` + `LessonProgress` (filtered to the requester) + `CourseProgressReadModel` (for the aggregate progress percent). 
    //
    //Future<CourseOutlineDto> getCourseOutline(String id) async
    test('test getCourseOutline', () async {
      // TODO
    });

    // Get the most recent scan for a library
    //
    // Returns the latest scan record regardless of status (running, succeeded, failed, cancelled).
    //
    //Future<ScanDto> getLatestLibraryScan(String id) async
    test('test getLatestLibraryScan', () async {
      // TODO
    });

    // Get a lesson with its materials and subtitles
    //
    // Returns lesson metadata, sidecar materials (PDF / Markdown / text / image), and available subtitle tracks. Raw filesystem paths are intentionally absent from the response (NFR-S-01); the player obtains a signed stream token for the lesson video and the material/subtitle blobs separately. 
    //
    //Future<LessonDto> getLesson(String id) async
    test('test getLesson', () async {
      // TODO
    });

    // Get a library by id
    //
    // Returns a single library by its server-generated identifier.
    //
    //Future<LibraryDto> getLibrary(String id) async
    test('test getLibrary', () async {
      // TODO
    });

    // Courses recently added to the requester's libraries
    //
    // Returns courses ordered by `createdAt` (most recent first), capped by `limit`. Sourced from the `Course` table directly — no completion filter is applied (a brand-new user sees their library's recent intake even before any progress events). 
    //
    //Future<RecentlyAddedDto> getRecentlyAdded({ int limit }) async
    test('test getRecentlyAdded', () async {
      // TODO
    });

    // Courses the requester finished most recently
    //
    // Returns courses where the requester completed the last lesson (`lessonsCompleted == lessonsTotal`), ordered by `lastSeenAt DESC` (which equals completion time for finished courses). Reads from the `CourseProgressReadModel` projection. 
    //
    //Future<RecentlyCompletedDto> getRecentlyCompleted({ int limit }) async
    test('test getRecentlyCompleted', () async {
      // TODO
    });

    // Roll-up of the requester's last seven days
    //
    // Total minutes watched and lessons completed by the requester over the trailing seven days. `range.from` is `now - 7d`, `range.to` is `now`, both ISO-8601 with offset. Both counters are zero for new users. Sourced from `LessonProgress` (sum of completion-time contributions) and `CourseProgressReadModel.lessonsCompleted`. 
    //
    //Future<YourWeekDto> getYourWeek() async
    test('test getYourWeek', () async {
      // TODO
    });

    // List courses (with filtering and sort)
    //
    // Returns courses the requester can see. Non-admins see only courses inside libraries they have a READ AccessGrant for; admins see all.  The `status` and `sort` query params back the Browse page (E14-F01-S02). `status` filters by per-user progress derived from the CourseProgressReadModel projection. `sort` is server-applied so the SPA never needs to re-sort the response. 
    //
    //Future<CourseListDto> listCourses({ String libraryId, String status, String sort }) async
    test('test listCourses', () async {
      // TODO
    });

    // List all registered libraries
    //
    // Returns all libraries the requester has READ access to. Admins see everything. 
    //
    //Future<LibraryListDto> listLibraries() async
    test('test listLibraries', () async {
      // TODO
    });

    // Register a new library (or share an existing path)
    //
    // Persists a library pointing at an absolute filesystem path.  **Idempotent on `rootPath`.** When a library with the same path already exists, the call returns the existing library and grants the calling user READ access to it instead of creating a duplicate row. The response body matches what `GET /libraries/{id}` would return for that library — the original `name`/`createdAt` are preserved (the new `name` you submitted is ignored).  For brand-new libraries the controller chains an initial `runLibraryScan` so courses become visible shortly after the response. No initial scan is fired when the path already existed (the existing library is presumed already scanned). 
    //
    //Future<LibraryDto> registerLibrary(RegisterLibraryRequest registerLibraryRequest) async
    test('test registerLibrary', () async {
      // TODO
    });

    // Hard-delete a library and every dependent row
    //
    // Admin-only destructive operation. Cascades through scans, courses (with sections/lessons/materials/subtitles), per-user progress, bookmarks, notes, and access grants. Files on disk are NOT touched — the library only exists in the DB; deletion just unlinks the folder from CourseShelf.  The cascade lives in a single Prisma `$transaction` so partial failures roll back. Idempotent: deleting an already-deleted id returns 404. 
    //
    //Future removeLibrary(String id) async
    test('test removeLibrary', () async {
      // TODO
    });

    // Trigger a scan of a library
    //
    // Walks the library tree, recognises Course / Section / Lesson layout, and records discoveries on a Scan aggregate. Returns 202 immediately with `status: running`; clients poll `GET /libraries/{id}/scans/latest`. A second scan with no filesystem changes is observably a no-op (`filesAdded` and `filesUpdated` are zero). 
    //
    //Future<ScanDto> runLibraryScan(String id) async
    test('test runLibraryScan', () async {
      // TODO
    });

    // Search the catalogue (courses + lessons)
    //
    // Case-insensitive substring search across course titles, section titles (matched into their courses), and lesson titles. Returns two result lists: courses and lessons. Each list is capped at `limit` (default 20, max 100). Results are sorted by best match (exact-prefix > word-prefix > substring) within each list.  Authorisation mirrors the listing endpoints — non-admin actors only see courses / lessons they have a READ grant on (via the course's library); admins see everything.  Empty `q` returns empty lists (no expensive full-table scan). Trimmed length must be ≥ 2 to avoid pathologically broad substring matches; shorter queries return empty lists too. 
    //
    //Future<SearchResultDto> searchCatalogue(String q, { int limit }) async
    test('test searchCatalogue', () async {
      // TODO
    });

    // Update course metadata
    //
    // Admin-only. Updates any combination of title / description / slug. Slug must be unique within the same library. At least one of `title`, `description`, or `slug` must be present (server-side validation rule — OpenAPI cannot express \"at-least-one\" natively). 
    //
    //Future<CourseDto> updateCourse(String id, UpdateCourseRequest updateCourseRequest) async
    test('test updateCourse', () async {
      // TODO
    });

    // Rename a library
    //
    // Admin-only mutation. Currently only the `name` field is mutable — changing `rootPath` would invalidate every scan and break stream URLs minted before the change, so it is intentionally not exposed here. Re-create the library if the disk path needs to change. 
    //
    //Future<LibraryDto> updateLibrary(String id, UpdateLibraryRequest updateLibraryRequest) async
    test('test updateLibrary', () async {
      // TODO
    });

  });
}
