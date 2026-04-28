/**
 * WHY this file exists:
 * Query payload for the your-week home-row endpoint. The actor carries id so
 * the handler can scope the aggregation to the requester's progress rows.
 * The time window is computed once in the handler from a single new Date().
 */
export class GetYourWeekQuery {
  constructor(public readonly actor: { id: string; role: string }) {}
}
