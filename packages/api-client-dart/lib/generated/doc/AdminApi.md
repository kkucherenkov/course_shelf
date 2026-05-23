# app_api_client.api.AdminApi

## Load the API package
```dart
import 'package:app_api_client/api.dart';
```

All URIs are relative to *http://localhost:3000*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getAdminDashboard**](AdminApi.md#getadmindashboard) | **GET** /api/v1/admin/dashboard | Operational snapshot for the admin dashboard
[**getAdminHasUsers**](AdminApi.md#getadminhasusers) | **GET** /api/v1/admin/has-users | Indicate whether any users exist in the platform
[**getAdminInstance**](AdminApi.md#getadmininstance) | **GET** /api/v1/admin/instance | Public instance configuration (self-registration, email verification, SSO providers)
[**getAdminUser**](AdminApi.md#getadminuser) | **GET** /api/v1/admin/users/{id} | Fetch a single user by id
[**listAdminLibraries**](AdminApi.md#listadminlibraries) | **GET** /api/v1/admin/libraries | List every library with admin-flavoured counters
[**listAdminScans**](AdminApi.md#listadminscans) | **GET** /api/v1/admin/scans | List recent scans across every library
[**listAdminUsers**](AdminApi.md#listadminusers) | **GET** /api/v1/admin/users | List every user in the platform
[**listScrapers**](AdminApi.md#listscrapers) | **GET** /api/v1/admin/scrapers | List available metadata scrapers
[**scrapeCoursePreview**](AdminApi.md#scrapecoursepreview) | **POST** /api/v1/admin/courses/{id}/scrape-preview | Preview scraped metadata for a course
[**startBackfillMetadata**](AdminApi.md#startbackfillmetadata) | **POST** /api/v1/admin/maintenance/backfill-metadata | Trigger a background metadata backfill across the library
[**updateAdminUser**](AdminApi.md#updateadminuser) | **PATCH** /api/v1/admin/users/{id} | Patch role and/or banned flag on a user
[**upsertInstructor**](AdminApi.md#upsertinstructor) | **POST** /api/v1/admin/instructors | Create or update an instructor
[**upsertStudio**](AdminApi.md#upsertstudio) | **POST** /api/v1/admin/studios | Create or update a studio
[**upsertTag**](AdminApi.md#upserttag) | **POST** /api/v1/admin/tags | Create or update a tag


# **getAdminDashboard**
> AdminDashboardDto getAdminDashboard()

Operational snapshot for the admin dashboard

Returns counts of major entities (libraries, users, courses, lessons), a summary of the most recent scan (if any), and the count of scan errors collected in the last 24 hours. Read-only — no side effects. 

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getAdminApi();

try {
    final response = api.getAdminDashboard();
    print(response);
} on DioException catch (e) {
    print('Exception when calling AdminApi->getAdminDashboard: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**AdminDashboardDto**](AdminDashboardDto.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getAdminHasUsers**
> HasUsersResponse getAdminHasUsers()

Indicate whether any users exist in the platform

First-run probe. Returns `{ hasUsers: false }` when the database has zero users — the SPA uses this to force `/setup` (admin onboarding). Returns `{ hasUsers: true }` once at least one user exists, locking `/setup` and routing fresh visitors to `/sign-in`.  No authentication is required: the very first request from a clean browser must succeed without credentials, and the response carries no sensitive information beyond a boolean. 

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getAdminApi();

try {
    final response = api.getAdminHasUsers();
    print(response);
} on DioException catch (e) {
    print('Exception when calling AdminApi->getAdminHasUsers: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**HasUsersResponse**](HasUsersResponse.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getAdminInstance**
> InstanceConfigDto getAdminInstance()

Public instance configuration (self-registration, email verification, SSO providers)

Anonymous endpoint that exposes the three runtime toggles the auth UI needs to draw the right surface:  - `selfRegistration` — when `false`, the sign-up entry points are   hidden and `/sign-up` returns the user to `/sign-in`. Admin opts   out via `AUTH_SELF_REGISTRATION=false`. - `emailVerificationRequired` — when `true`, the sign-up wizard   renders step 2 (6-digit code). When `false`, sign-up jumps from   step 1 (account) directly to step 3 (library setup). Mirrors   Better Auth's `emailVerification` plugin toggle. Admin opts in   via `AUTH_EMAIL_VERIFICATION=true`. - `ssoProviders` — array of OAuth/SSO providers configured for   this instance. v1 ships `[]`; v2 lands Better Auth's   `genericOAuth` plugin and the array starts to populate, lighting   up the SsoBlock without UI changes.  No authentication is required — the first GET from a clean browser decides whether the auth pages can even draw a sign-up CTA, and the response carries no sensitive information. 

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getAdminApi();

try {
    final response = api.getAdminInstance();
    print(response);
} on DioException catch (e) {
    print('Exception when calling AdminApi->getAdminInstance: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**InstanceConfigDto**](InstanceConfigDto.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getAdminUser**
> AdminUserListItem getAdminUser(id)

Fetch a single user by id

Admin-only single-user fetch — used by the admin permissions page to show whose grants are being edited. Returns the same `AdminUserListItem` shape as the listing endpoint. 

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getAdminApi();
final String id = id_example; // String | User id (uuid).

try {
    final response = api.getAdminUser(id);
    print(response);
} on DioException catch (e) {
    print('Exception when calling AdminApi->getAdminUser: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**| User id (uuid). | 

### Return type

[**AdminUserListItem**](AdminUserListItem.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **listAdminLibraries**
> AdminLibraryListDto listAdminLibraries()

List every library with admin-flavoured counters

Returns every library in the system enriched with the counts and last-scan summary the admin libraries page renders per row. Admin- only — `listLibraries` is the user-facing endpoint and respects per-library grants; this one bypasses grants because admins see everything.  Per row:   - `coursesCount` / `lessonsCount` are aggregate counts from the     catalog (`Course.libraryId == library.id`).   - `lastScan` is the most recent scan on the library (any status),     or `null` when no scan has ever run. 

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getAdminApi();

try {
    final response = api.listAdminLibraries();
    print(response);
} on DioException catch (e) {
    print('Exception when calling AdminApi->listAdminLibraries: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**AdminLibraryListDto**](AdminLibraryListDto.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **listAdminScans**
> AdminScanListDto listAdminScans(limit, libraryId)

List recent scans across every library

Ordered by `startedAt` descending (newest first). Used by the admin dashboard's \"Recent scans\" table. Cross-library — admin-only; non-admin actors see 403 even if they have READ grants on individual libraries. Capped at `limit` (default 20, max 100). 

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getAdminApi();
final int limit = 56; // int | Maximum number of scans to return.
final String libraryId = libraryId_example; // String | When set, only return scans for the given library. Used by the admin library-detail page's scan-history table. Unknown library ids return an empty list (not 404 — the view is a filter, not a fetch).

try {
    final response = api.listAdminScans(limit, libraryId);
    print(response);
} on DioException catch (e) {
    print('Exception when calling AdminApi->listAdminScans: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **limit** | **int**| Maximum number of scans to return. | [optional] [default to 20]
 **libraryId** | **String**| When set, only return scans for the given library. Used by the admin library-detail page's scan-history table. Unknown library ids return an empty list (not 404 — the view is a filter, not a fetch). | [optional] 

### Return type

[**AdminScanListDto**](AdminScanListDto.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **listAdminUsers**
> AdminUserListDto listAdminUsers(search, limit)

List every user in the platform

Admin-only listing for the admin users page. Ordered by `createdAt` descending (newest first). The optional `search` filter matches email and `name` substrings (case-insensitive). `role` values are normalised to lowercase (`admin`, `user`, `guest`) regardless of what the auth backend stamps on the row in the database — the SPA only cares about the canonical lowercase form. 

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getAdminApi();
final String search = search_example; // String | Case-insensitive substring filter on `email` or `name`.
final int limit = 56; // int | Maximum number of users to return.

try {
    final response = api.listAdminUsers(search, limit);
    print(response);
} on DioException catch (e) {
    print('Exception when calling AdminApi->listAdminUsers: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **search** | **String**| Case-insensitive substring filter on `email` or `name`. | [optional] 
 **limit** | **int**| Maximum number of users to return. | [optional] [default to 50]

### Return type

[**AdminUserListDto**](AdminUserListDto.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **listScrapers**
> ScraperListDto listScrapers()

List available metadata scrapers

Returns the scrapers configured on this instance with the invocation kinds each supports. Requires admin role.

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getAdminApi();

try {
    final response = api.listScrapers();
    print(response);
} on DioException catch (e) {
    print('Exception when calling AdminApi->listScrapers: $e\n');
}
```

### Parameters
This endpoint does not need any parameter.

### Return type

[**ScraperListDto**](ScraperListDto.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **scrapeCoursePreview**
> ScrapePreviewResponse scrapeCoursePreview(id, scrapePreviewRequest)

Preview scraped metadata for a course

Runs the selected scraper against the given input and returns candidate metadata fragments. PREVIEW ONLY — nothing is persisted and scraped names are not resolved to existing entities. Requires admin role. 

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getAdminApi();
final String id = id_example; // String | Server-generated cuid identifying the course.
final ScrapePreviewRequest scrapePreviewRequest = {"kind":"url","url":"https://www.youtube.com/playlist?list=PL123"}; // ScrapePreviewRequest | 

try {
    final response = api.scrapeCoursePreview(id, scrapePreviewRequest);
    print(response);
} on DioException catch (e) {
    print('Exception when calling AdminApi->scrapeCoursePreview: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**| Server-generated cuid identifying the course. | 
 **scrapePreviewRequest** | [**ScrapePreviewRequest**](ScrapePreviewRequest.md)|  | 

### Return type

[**ScrapePreviewResponse**](ScrapePreviewResponse.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **startBackfillMetadata**
> BackfillJobAccepted startBackfillMetadata(backfillMetadataRequest)

Trigger a background metadata backfill across the library

Enqueues a background job that walks every course in the specified library (or all libraries when `libraryId` is omitted), reads each course's `course.json`, and upserts instructor/studio/tag links and extended fields. Returns 202 immediately with a `jobId`; subscribe to the `maintenance:backfill:{jobId}` Centrifugo channel to track progress. Admin only. 

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getAdminApi();
final BackfillMetadataRequest backfillMetadataRequest = {}; // BackfillMetadataRequest | 

try {
    final response = api.startBackfillMetadata(backfillMetadataRequest);
    print(response);
} on DioException catch (e) {
    print('Exception when calling AdminApi->startBackfillMetadata: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **backfillMetadataRequest** | [**BackfillMetadataRequest**](BackfillMetadataRequest.md)|  | [optional] 

### Return type

[**BackfillJobAccepted**](BackfillJobAccepted.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **updateAdminUser**
> AdminUserListItem updateAdminUser(id, adminUpdateUserRequest)

Patch role and/or banned flag on a user

Inline mutation used by the admin users page's role chip. At least one of `role` or `banned` must be present. The auth backend stores roles in upper-case; this endpoint translates the lowercase request to the persisted format and back.  Banning is a soft delete from the user's perspective — sessions are invalidated and sign-in fails until the flag is cleared. Removing the user record outright is a separate, deferred operation. 

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getAdminApi();
final String id = id_example; // String | User id (uuid).
final AdminUpdateUserRequest adminUpdateUserRequest = {"role":"admin"}; // AdminUpdateUserRequest | 

try {
    final response = api.updateAdminUser(id, adminUpdateUserRequest);
    print(response);
} on DioException catch (e) {
    print('Exception when calling AdminApi->updateAdminUser: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **String**| User id (uuid). | 
 **adminUpdateUserRequest** | [**AdminUpdateUserRequest**](AdminUpdateUserRequest.md)|  | 

### Return type

[**AdminUserListItem**](AdminUserListItem.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **upsertInstructor**
> InstructorDto upsertInstructor(upsertInstructorRequest)

Create or update an instructor

Creates a new instructor record or updates an existing one (matched by slug or an externalId collision). Returns 409 when the provided slug already exists and belongs to a *different* instructor than would be matched by externalIds. Requires admin role. 

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getAdminApi();
final UpsertInstructorRequest upsertInstructorRequest = {"displayName":"Andrei Neagoie","slug":"andrei-neagoie","externalIds":[{"source":"udemy","externalId":"udemy:instructor:42","url":"https://udemy.com/user/42"}]}; // UpsertInstructorRequest | 

try {
    final response = api.upsertInstructor(upsertInstructorRequest);
    print(response);
} on DioException catch (e) {
    print('Exception when calling AdminApi->upsertInstructor: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **upsertInstructorRequest** | [**UpsertInstructorRequest**](UpsertInstructorRequest.md)|  | 

### Return type

[**InstructorDto**](InstructorDto.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **upsertStudio**
> StudioDto upsertStudio(upsertStudioRequest)

Create or update a studio

Creates a new studio record or updates an existing one (matched by slug or externalId collision). Returns 409 when the slug is taken by a different studio. Requires admin role. 

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getAdminApi();
final UpsertStudioRequest upsertStudioRequest = {"displayName":"Zero To Mastery","slug":"zero-to-mastery","externalIds":[{"source":"udemy","externalId":"udemy:organization:ztm","url":"https://udemy.com/organization/ztm"}]}; // UpsertStudioRequest | 

try {
    final response = api.upsertStudio(upsertStudioRequest);
    print(response);
} on DioException catch (e) {
    print('Exception when calling AdminApi->upsertStudio: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **upsertStudioRequest** | [**UpsertStudioRequest**](UpsertStudioRequest.md)|  | 

### Return type

[**StudioDto**](StudioDto.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **upsertTag**
> TagDto upsertTag(upsertTagRequest)

Create or update a tag

Creates a new tag or updates an existing one (matched by slug or externalId collision). Returns 409 when the slug is taken by a different tag. Requires admin role. 

### Example
```dart
import 'package:app_api_client/api.dart';

final api = AppApiClient().getAdminApi();
final UpsertTagRequest upsertTagRequest = {"displayName":"JavaScript","slug":"javascript","category":"language"}; // UpsertTagRequest | 

try {
    final response = api.upsertTag(upsertTagRequest);
    print(response);
} on DioException catch (e) {
    print('Exception when calling AdminApi->upsertTag: $e\n');
}
```

### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **upsertTagRequest** | [**UpsertTagRequest**](UpsertTagRequest.md)|  | 

### Return type

[**TagDto**](TagDto.md)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/problem+json

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

