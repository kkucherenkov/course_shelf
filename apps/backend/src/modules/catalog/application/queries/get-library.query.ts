/**
 * WHY this file exists:
 * A Query is a plain data object representing a read-side request.
 * GetLibrary fetches a single library by its server-generated id.
 */
export class GetLibraryQuery {
  constructor(public readonly id: string) {}
}
