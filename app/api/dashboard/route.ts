import {
  DOWNLOAD_DAILY_LIMIT,
  UPLOAD_DAILY_LIMIT,
  DashboardActivity,
} from "@/lib/medical-records";
import { handleRouteError } from "@/lib/server/api";
import {
  getDailyUsage,
  getStorageQuotaBytes,
  listRecords,
} from "@/lib/server/supabase";
import {
  formatShortWeekday,
  getDateKey,
  getLastDateKeys,
  relativeTimeFromNow,
} from "@/lib/server/time";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const today = getDateKey();
    const historyDates = getLastDateKeys(7, today);
    const [records, uploadUsage, downloadUsage] = await Promise.all([
      listRecords({ limit: 5000 }),
      getDailyUsage("upload", UPLOAD_DAILY_LIMIT, today),
      getDailyUsage("download", DOWNLOAD_DAILY_LIMIT, today),
    ]);

    const history = historyDates.map((date) => ({
      date,
      name: formatShortWeekday(date),
      uploads: records.filter((record) => record.recordDate === date).length,
      downloads:
        date === today
          ? downloadUsage.used
          : records.filter((record) => record.lastDownloadedAt?.slice(0, 10) === date).length,
    }));
    const historyDateSet = new Set(historyDates);
    const recentActivity: DashboardActivity[] = records.slice(0, 8).map((record) => ({
      time: relativeTimeFromNow(record.uploadedAt),
      event: `${record.fileName} uploaded${record.ipNumber ? ` for ${record.ipNumber}` : ""}`,
      status: record.status === "Failed" ? "error" : "success",
      source: record.source === "folder-sync" ? "Folder sync" : "Manual upload",
    }));

    return Response.json({
      totalRecords: records.length,
      uploadedToday: records.filter((record) => record.recordDate === today).length,
      uploadedThisWeek: records.filter((record) => historyDateSet.has(record.recordDate)).length,
      downloadsToday: downloadUsage.used,
      uploadLimit: UPLOAD_DAILY_LIMIT,
      downloadLimit: DOWNLOAD_DAILY_LIMIT,
      storageUsedBytes: records.reduce((total, record) => total + record.sizeBytes, 0),
      storageQuotaBytes: getStorageQuotaBytes(),
      history,
      recentActivity,
      uploadUsage,
      downloadUsage,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
