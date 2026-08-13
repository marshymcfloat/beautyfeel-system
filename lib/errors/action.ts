import type { ActionResult } from "./domain-error";
import { toActionError } from "./domain-error";

export async function runAction<T>(work: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await work() };
  } catch (error) {
    return toActionError(error);
  }
}
