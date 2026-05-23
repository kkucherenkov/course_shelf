export class BackfillCourseMetadataCommand {
  constructor(
    /** When defined, only that library is backfilled. Undefined → all libraries. */
    public readonly libraryId: string | undefined,
    /** Unique job identifier (cuid). Included in every progress message. */
    public readonly jobId: string,
    /**
     * When defined, the handler publishes BackfillStarted / BackfillProgress /
     * BackfillFinished messages to this Centrifugo channel.
     * CLI dispatches with undefined → silent run (no Centrifugo calls).
     */
    public readonly progressChannel: string | undefined,
  ) {}
}
