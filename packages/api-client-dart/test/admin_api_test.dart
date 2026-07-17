import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';


/// tests for AdminApi
void main() {
  final instance = AppApiClient().getAdminApi();

  group(AdminApi, () {
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

    // Operational snapshot for the admin dashboard
    //
    // Returns counts of major entities (libraries, users, courses, lessons), a summary of the most recent scan (if any), and the count of scan errors collected in the last 24 hours. Read-only — no side effects. 
    //
    //Future<AdminDashboardDto> getAdminDashboard() async
    test('test getAdminDashboard', () async {
      // TODO
    });

    // Indicate whether any users exist in the platform
    //
    // First-run probe. Returns `{ hasUsers: false }` when the database has zero users — the SPA uses this to force `/setup` (admin onboarding). Returns `{ hasUsers: true }` once at least one user exists, locking `/setup` and routing fresh visitors to `/sign-in`.  No authentication is required: the very first request from a clean browser must succeed without credentials, and the response carries no sensitive information beyond a boolean. 
    //
    //Future<HasUsersResponse> getAdminHasUsers() async
    test('test getAdminHasUsers', () async {
      // TODO
    });

    // Public instance configuration (self-registration, email verification, SSO providers)
    //
    // Anonymous endpoint that exposes the three runtime toggles the auth UI needs to draw the right surface:  - `selfRegistration` — when `false`, the sign-up entry points are   hidden and `/sign-up` returns the user to `/sign-in`. Admin opts   out via `AUTH_SELF_REGISTRATION=false`. - `emailVerificationRequired` — when `true`, the sign-up wizard   renders step 2 (6-digit code). When `false`, sign-up jumps from   step 1 (account) directly to step 3 (library setup). Mirrors   Better Auth's `emailVerification` plugin toggle. Admin opts in   via `AUTH_EMAIL_VERIFICATION=true`. - `ssoProviders` — array of OAuth/SSO providers configured for   this instance. v1 ships `[]`; v2 lands Better Auth's   `genericOAuth` plugin and the array starts to populate, lighting   up the SsoBlock without UI changes.  No authentication is required — the first GET from a clean browser decides whether the auth pages can even draw a sign-up CTA, and the response carries no sensitive information. 
    //
    //Future<InstanceConfigDto> getAdminInstance() async
    test('test getAdminInstance', () async {
      // TODO
    });

    // Fetch a single user by id
    //
    // Admin-only single-user fetch — used by the admin permissions page to show whose grants are being edited. Returns the same `AdminUserListItem` shape as the listing endpoint. 
    //
    //Future<AdminUserListItem> getAdminUser(String id) async
    test('test getAdminUser', () async {
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

    // List every library with admin-flavoured counters
    //
    // Returns every library in the system enriched with the counts and last-scan summary the admin libraries page renders per row. Admin- only — `listLibraries` is the user-facing endpoint and respects per-library grants; this one bypasses grants because admins see everything.  Per row:   - `coursesCount` / `lessonsCount` are aggregate counts from the     catalog (`Course.libraryId == library.id`).   - `lastScan` is the most recent scan on the library (any status),     or `null` when no scan has ever run. 
    //
    //Future<AdminLibraryListDto> listAdminLibraries() async
    test('test listAdminLibraries', () async {
      // TODO
    });

    // List recent scans across every library
    //
    // Ordered by `startedAt` descending (newest first). Used by the admin dashboard's \"Recent scans\" table. Cross-library — admin-only; non-admin actors see 403 even if they have READ grants on individual libraries. Capped at `limit` (default 20, max 100). 
    //
    //Future<AdminScanListDto> listAdminScans({ int limit, String libraryId }) async
    test('test listAdminScans', () async {
      // TODO
    });

    // List every user in the platform
    //
    // Admin-only listing for the admin users page. Ordered by `createdAt` descending (newest first). The optional `search` filter matches email and `name` substrings (case-insensitive). `role` values are normalised to lowercase (`admin`, `user`, `guest`) regardless of what the auth backend stamps on the row in the database — the SPA only cares about the canonical lowercase form. 
    //
    //Future<AdminUserListDto> listAdminUsers({ String search, int limit }) async
    test('test listAdminUsers', () async {
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

    // List available metadata scrapers
    //
    // Returns the scrapers configured on this instance with the invocation kinds each supports. Requires admin role.
    //
    //Future<ScraperListDto> listScrapers() async
    test('test listScrapers', () async {
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

    // Preview scraped metadata for a course
    //
    // Runs the selected scraper against the given input and returns candidate metadata fragments. PREVIEW ONLY — nothing is persisted and scraped names are not resolved to existing entities. Requires admin role. 
    //
    //Future<ScrapePreviewResponse> scrapeCoursePreview(String id, ScrapePreviewRequest scrapePreviewRequest) async
    test('test scrapeCoursePreview', () async {
      // TODO
    });

    // Trigger a background metadata backfill across the library
    //
    // Enqueues a background job that walks every course in the specified library (or all libraries when `libraryId` is omitted), reads each course's `course.json`, and upserts instructor/studio/tag links and extended fields. Returns 202 immediately with a `jobId`; subscribe to the `maintenance:backfill:{jobId}` Centrifugo channel to track progress. Admin only. 
    //
    //Future<BackfillJobAccepted> startBackfillMetadata({ BackfillMetadataRequest backfillMetadataRequest }) async
    test('test startBackfillMetadata', () async {
      // TODO
    });

    // Patch role and/or banned flag on a user
    //
    // Inline mutation used by the admin users page's role chip. At least one of `role` or `banned` must be present. The auth backend stores roles in upper-case; this endpoint translates the lowercase request to the persisted format and back.  Banning is a soft delete from the user's perspective — sessions are invalidated and sign-in fails until the flag is cleared. Removing the user record outright is a separate, deferred operation. 
    //
    //Future<AdminUserListItem> updateAdminUser(String id, AdminUpdateUserRequest adminUpdateUserRequest) async
    test('test updateAdminUser', () async {
      // TODO
    });

    // Create or update an instructor
    //
    // Creates a new instructor record or updates an existing one (matched by slug or an externalId collision). Returns 409 when the provided slug already exists and belongs to a *different* instructor than would be matched by externalIds. Requires admin role. 
    //
    //Future<InstructorDto> upsertInstructor(UpsertInstructorRequest upsertInstructorRequest) async
    test('test upsertInstructor', () async {
      // TODO
    });

    // Create or update a studio
    //
    // Creates a new studio record or updates an existing one (matched by slug or externalId collision). Returns 409 when the slug is taken by a different studio. Requires admin role. 
    //
    //Future<StudioDto> upsertStudio(UpsertStudioRequest upsertStudioRequest) async
    test('test upsertStudio', () async {
      // TODO
    });

    // Create or update a tag
    //
    // Creates a new tag or updates an existing one (matched by slug or externalId collision). Returns 409 when the slug is taken by a different tag. Requires admin role. 
    //
    //Future<TagDto> upsertTag(UpsertTagRequest upsertTagRequest) async
    test('test upsertTag', () async {
      // TODO
    });

  });
}
