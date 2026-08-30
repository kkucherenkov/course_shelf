/**
 * WHY this file exists:
 * The single rule that decides whether a lesson needs transcribing. It is what
 * makes a re-run cheap and a restart survivable: no durable queue is needed
 * because re-running skips everything already done, so a crash costs at most
 * the lesson that was in flight.
 *
 * A hand-made sidecar always wins, even under `force`. Force is for redoing
 * OUR work — spending six hours to overwrite a human's subtitles with a
 * machine's is never what someone meant by "re-transcribe".
 *
 * Pure function, no I/O: the caller has already stat'ed the video and loaded
 * the existing transcript row.
 */

export type TranscriptionDecision = 'skip-sidecar' | 'skip-current' | 'transcribe';

export interface TranscriptionDecisionInput {
  /** True when the lesson already has a hand-made/shipped subtitle track. */
  readonly hasSidecarSubtitle: boolean;
  /** The existing generated transcript for this lesson, if any. */
  readonly existing: { readonly sourceMtime: Date; readonly sourceSize: number } | null;
  /** The video file as it is on disk right now. */
  readonly video: { readonly mtime: Date; readonly size: number };
  readonly force: boolean;
}

export function decideTranscription(input: TranscriptionDecisionInput): TranscriptionDecision {
  if (input.hasSidecarSubtitle) return 'skip-sidecar';
  if (input.force) return 'transcribe';
  if (input.existing === null) return 'transcribe';

  const sameMtime = input.existing.sourceMtime.getTime() === input.video.mtime.getTime();
  const sameSize = input.existing.sourceSize === input.video.size;
  return sameMtime && sameSize ? 'skip-current' : 'transcribe';
}
