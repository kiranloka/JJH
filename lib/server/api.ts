import { SupabaseConfigurationError } from "@/lib/server/supabase";

export class ApiError extends Error {
  constructor(
    message: string,
    public status = 400
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function jsonError(message: string, status = 400, details?: unknown) {
  return Response.json({ error: message, details }, { status });
}

export function handleRouteError(error: unknown) {
  if (error instanceof ApiError) {
    return jsonError(error.message, error.status);
  }

  if (error instanceof SupabaseConfigurationError) {
    return jsonError(error.message, 503);
  }

  console.error(error);
  return jsonError(error instanceof Error ? error.message : "Unexpected server error", 500);
}
