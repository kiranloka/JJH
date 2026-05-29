import { DOWNLOAD_DAILY_LIMIT } from "@/lib/medical-records";
import { ApiError, handleRouteError, jsonError } from "@/lib/server/api";
import {
  consumeDailyQuota,
  getRecordById,
  incrementRecordDownload,
  releaseDailyQuota,
} from "@/lib/server/supabase";
import { getDateKey } from "@/lib/server/time";
import { getStorageProvider } from "@/lib/server/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const quotaDate = getDateKey();
  let quotaReserved = false;

  try {
    const { id } = await context.params;
    const record = await getRecordById(id);

    if (!record) {
      throw new ApiError("Record not found.", 404);
    }

    const quota = await consumeDailyQuota("download", DOWNLOAD_DAILY_LIMIT, 1, quotaDate);

    if (!quota.allowed) {
      return jsonError("Daily download limit reached.", 429, quota);
    }

    quotaReserved = true;

    const storage = getStorageProvider(record.storageProvider);
    const url = await storage.createSignedUrl({
      bucket: record.bucket,
      key: record.objectKey,
      expiresInSeconds: 300,
      downloadFileName: record.fileName,
    });

    await incrementRecordDownload(record.id);

    quotaReserved = false;
    return Response.redirect(url, 302);
  } catch (error) {
    if (quotaReserved) {
      await releaseDailyQuota("download", 1, quotaDate).catch(console.error);
    }

    return handleRouteError(error);
  }
}
