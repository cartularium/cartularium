export type UnsupportedMaterializationFeature = "named-functions";

export interface UnsupportedMaterializationDetail {
  feature: UnsupportedMaterializationFeature;
  code: string;
}

export class UnsupportedMaterializationError extends Error {
  override name = "UnsupportedMaterializationError";

  constructor(
    readonly detail: UnsupportedMaterializationDetail,
    message: string,
  ) {
    super(message);
  }
}
