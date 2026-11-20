export interface Artifact {
  id: number;
  name: string;
  /** The summary fields below are only filled by the list endpoint. */
  acquisitionsCount: number;
  completedAcquisitionIds: Array<number>;
  lastAcquisitionAt: string | null;
  sizeBytes: number;
  thumbnail: string | null;
}
