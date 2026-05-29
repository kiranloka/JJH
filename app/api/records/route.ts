import { isRecordStatus } from "@/lib/medical-records";
import { handleRouteError } from "@/lib/server/api";
import { listRecords } from "@/lib/server/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") ?? 500);
    const status = searchParams.get("status");

    const records = await listRecords({
      limit: Number.isFinite(limit) ? limit : 500,
      fromDate: searchParams.get("fromDate") ?? undefined,
      toDate: searchParams.get("toDate") ?? undefined,
      status: status && isRecordStatus(status) ? status : undefined,
    });

    return Response.json({ records });
  } catch (error) {
    return handleRouteError(error);
  }
}
