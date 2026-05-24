/** WHY this file exists: input for fetching a single identify task by id. */
export class GetIdentifyTaskQuery {
  constructor(public readonly id: string) {}
}
