import { ApiError, handleRouteError } from "@/lib/server/api";
import { getRecordById } from "@/lib/server/supabase";
import { getStorageProvider } from "@/lib/server/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const record = await getRecordById(id);

    if (!record) {
      throw new ApiError("Record not found.", 404);
    }

    const storage = getStorageProvider(record.storageProvider);
    const url = await storage.createSignedUrl({
      bucket: record.bucket,
      key: record.objectKey,
      expiresInSeconds: 300,
    });

    return Response.redirect(url, 302);
  } catch (error) {
    return handleRouteError(error);
  }
}
