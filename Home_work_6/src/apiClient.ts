import { z } from "zod";
import { ApiHttpError, ApiValidationError } from "./errors.js";

export interface ApiClientOptions {
  baseURL: string;
  headers?: Record<string, string>;
}

export class ApiClient {
  constructor(private options: ApiClientOptions) { }

  async get(
    path: string,
    schemas: EndpointSchemas,
    query?: Record<string, unknown>,
    headers?: Record<string, string>,
  ) {
    const url = new URL(path, this.options.baseURL);

    const response = await fetch(url.href, {
      method: "GET",
      headers: { ...this.options.headers, ...headers },
    });

    if (response.status >= 400) {
      let details: unknown;
      try {
        details = await response.json();
      } catch {
        details = await response.text();
      }
      throw new ApiHttpError(url.href, response.status, details);
    }

    const parsed = schemas.responseSchema.safeParse(await response.json());
    if (!parsed.success) throw new ApiValidationError(url.href, parsed.error);
    return parsed.data;
  }
}


export interface EndpointSchemas {
  querySchema?: z.ZodTypeAny;
  bodySchema?: z.ZodTypeAny;
  responseSchema: z.ZodTypeAny;
}
