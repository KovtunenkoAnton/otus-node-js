import type { ZodError } from "zod";

export class ApiHttpError extends Error {
  constructor(
    readonly url: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(`HTTP ${status} for ${url}`);
  }
}

export class ApiValidationError extends Error {
  constructor(
    readonly url: string,
    readonly zodError: ZodError,
  ) {
    super(
      `Validation failed for ${url}: ${zodError.issues
        .map((i) => i.message)
        .join("; ")}`,
    );
  }
}
