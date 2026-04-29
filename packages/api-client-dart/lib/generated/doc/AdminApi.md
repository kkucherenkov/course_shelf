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
[**listAdminLibraries**](AdminApi.md#listadminlibraries) | **GET** /api/v1/admin/libraries | List every library with admin-flavoured counters
[**listAdminScans**](AdminApi.md#listadminscans) | **GET** /api/v1/admin/scans | List recent scans across every library


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

