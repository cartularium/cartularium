export interface SmokeLifecycleDependencies {
  create: () => Promise<string>;
  submit: (spreadsheetId: string) => Promise<void>;
  remove: (spreadsheetId: string) => Promise<boolean>;
}

export async function runCleanupSafeSmoke(
  dependencies: SmokeLifecycleDependencies,
): Promise<string> {
  const spreadsheetId = await dependencies.create();
  let smokeFailure: unknown;

  try {
    await dependencies.submit(spreadsheetId);
  } catch (error) {
    smokeFailure = error;
  }

  let cleanupFailure: unknown;
  try {
    if (!(await dependencies.remove(spreadsheetId))) {
      cleanupFailure = new Error(`failed to delete smoke spreadsheet: ${spreadsheetId}`);
    }
  } catch (error) {
    cleanupFailure = error;
  }

  if (smokeFailure && cleanupFailure) {
    throw new AggregateError([smokeFailure, cleanupFailure], "smoke and cleanup both failed");
  }
  if (smokeFailure) throw smokeFailure;
  if (cleanupFailure) throw cleanupFailure;
  return spreadsheetId;
}
