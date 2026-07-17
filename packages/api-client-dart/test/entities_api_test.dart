import 'package:test/test.dart';
import 'package:app_api_client/app_api_client.dart';


/// tests for EntitiesApi
void main() {
  final instance = AppApiClient().getEntitiesApi();

  group(EntitiesApi, () {
    // Get a single instructor by slug
    //
    // Returns the instructor details plus a list of their associated courses.
    //
    //Future<InstructorDetailDto> getInstructor(String slug) async
    test('test getInstructor', () async {
      // TODO
    });

    // Get a single studio by slug
    //
    // Returns the studio details plus a list of their associated courses.
    //
    //Future<StudioDetailDto> getStudio(String slug) async
    test('test getStudio', () async {
      // TODO
    });

    // Get a single tag by slug
    //
    // Returns the tag details plus a list of associated courses.
    //
    //Future<TagDetailDto> getTag(String slug) async
    test('test getTag', () async {
      // TODO
    });

    // List instructors with optional search
    //
    // Returns a paginated list of instructors. The optional `search` parameter performs a case-insensitive substring match on `displayName`. Results are ordered by `displayName` ascending. 
    //
    //Future<InstructorListDto> listInstructors({ int offset, int limit, String search }) async
    test('test listInstructors', () async {
      // TODO
    });

    // List studios with optional search
    //
    // Returns a paginated list of studios. The optional `search` parameter performs a case-insensitive substring match on `displayName`. Results are ordered by `displayName` ascending. 
    //
    //Future<StudioListDto> listStudios({ int offset, int limit, String search }) async
    test('test listStudios', () async {
      // TODO
    });

    // List tags with optional search and category filter
    //
    // Returns a paginated list of tags. The optional `search` parameter performs a case-insensitive substring match on `displayName`. The optional `category` parameter filters by exact category value. Results are ordered by `displayName` ascending. 
    //
    //Future<TagListDto> listTags({ int offset, int limit, String search, String category }) async
    test('test listTags', () async {
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
