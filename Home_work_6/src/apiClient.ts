import { z } from "zod";
import { ApiHttpError, ApiValidationError } from "./errors.js";

export interface ApiClientOptions {
  baseURL: string;
  headers?: Record<string, string>;
}

export class ApiClient {
  constructor(private options: ApiClientOptions) { }

  async get<S extends EndpointSchemas>(
    path: string,
    schemas: S,
    query?: Record<string, unknown>,
    headers?: Record<string, string>,
  ): Promise<EndpointResponse<S>> {
    const url = new URL(path, this.options.baseURL);

    let queryToSerialize = query ?? {};
    if (schemas.querySchema) {
      const parsedQuery = schemas.querySchema.safeParse(queryToSerialize);
      if (!parsedQuery.success) throw new ApiValidationError(url.href, parsedQuery.error);
      queryToSerialize = parsedQuery.data;
    }
    for (const [key, value] of Object.entries(queryToSerialize)) {
      url.searchParams.set(key, String(value));
    }

    const response = await fetch(url.href, {
      method: "GET",
      headers: { ...this.options.headers, ...headers },
    });

    if (response.status >= 400) {
      const text = await response.text();
      let details: unknown;
      try {
        details = JSON.parse(text);
      } catch {
        details = text;
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

export type EndpointResponse<S extends EndpointSchemas> = z.infer<S["responseSchema"]>;
