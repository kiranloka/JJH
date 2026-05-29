import {
  MAX_UPLOAD_SIZE_BYTES,
  UPLOAD_DAILY_LIMIT,
  normalizeSections,
} from "@/lib/medical-records";
import { ApiError, handleRouteError, jsonError } from "@/lib/server/api";
import {
  consumeDailyQuota,
  createRecord,
  getSupabaseBucket,
  releaseDailyQuota,
} from "@/lib/server/supabase";
import { getDateKey } from "@/lib/server/time";
import { getStorageProvider } from "@/lib/server/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const quotaDate = getDateKey();
  let quotaReserved = false;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new ApiError("A PDF file is required.", 400);
    }

    if (!isPdf(file)) {
      throw new ApiError("Only PDF files are supported.", 400);
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      throw new ApiError("File exceeds the 50MB upload limit.", 413);
    }

    const quota = await consumeDailyQuota("upload", UPLOAD_DAILY_LIMIT, 1, quotaDate);

    if (!quota.allowed) {
      return jsonError("Daily upload limit reached.", 429, quota);
    }

    quotaReserved = true;

    const id = crypto.randomUUID();
    const source = formData.get("source") === "folder-sync" ? "folder-sync" : "manual";
    const recordDate = parseRecordDate(formData.get("recordDate")) ?? quotaDate;
    const fileName = sanitizeFileName(file.name);
    const bucket = process.env.STORAGE_BUCKET || getSupabaseBucket();
    const objectKey = `${recordDate}/${id}/${fileName}`;
    const storage = getStorageProvider();

    await storage.putObject({
      bucket,
      key: objectKey,
      body: file,
      contentType: file.type || "application/pdf",
    });

    const record = await createRecord({
      id,
      ipNumber: optionalText(formData.get("ipNumber")),
      patientName: optionalText(formData.get("patientName")),
      doctorName: optionalText(formData.get("doctorName")),
      sections: parseSections(formData.get("sections")),
      fileName,
      contentType: file.type || "application/pdf",
      sizeBytes: file.size,
      storageProvider: storage.name,
      bucket,
      objectKey,
      status: "Synced",
      source,
      recordDate,
    });

    quotaReserved = false;
    return Response.json({ record, quota }, { status: 201 });
  } catch (error) {
    if (quotaReserved) {
      await releaseDailyQuota("upload", 1, quotaDate).catch(console.error);
    }

    return handleRouteError(error);
  }
}

function isPdf(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function optionalText(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized ? normalized : null;
}

function parseRecordDate(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  return value;
}

function parseSections(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return normalizeSections(parsed);
  } catch {
    return normalizeSections(value);
  }
}

function sanitizeFileName(fileName: string) {
  const sanitized = fileName
    .replace(/[\\/]/g, "_")
    .replace(/[^\w.\- ]+/g, "_")
    .replace(/\s+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 160);

  return sanitized || `record-${Date.now()}.pdf`;
}
