export class BackfillTranscriptLanguageCommand {
  constructor(
    /** Language a row keeps when its cue text cannot be confidently classified. */
    public readonly defaultLanguage: string,
    /** true (default) — report what would change; false — rename files and write rows. */
    public readonly dryRun: boolean,
  ) {}
}
