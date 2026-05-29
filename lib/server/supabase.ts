import {
  DEFAULT_STORAGE_QUOTA_BYTES,
  DOWNLOAD_DAILY_LIMIT,
  formatDateInputValue,
  isValidDateInput,
  MedicalRecord,
  MedicalRecordUpdate,
  QuotaAction,
  QuotaUsage,
  RecordSource,
  RecordStatus,
  StorageProviderName,
  UPLOAD_DAILY_LIMIT,
  isRecordStatus,
  normalizeSections,
} from "@/lib/medical-records";
import { getDateKey } from "@/lib/server/time";

export class SupabaseConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupabaseConfigurationError";
  }
}

interface SupabaseConfig {
  url: string;
  serviceRoleKey: string;
}

interface DbMedicalRecord {
  id: string;
  ip_number: string | null;
  patient_name: string | null;
  doctor_name: string | null;
  sections: string[] | null;
  file_name: string;
  content_type: string;
  size_bytes: number | string;
  storage_provider: string;
  bucket: string;
  object_key: string;
  status: string;
  source: string;
  record_date: string;
  uploaded_at: string;
  updated_at: string;
  last_downloaded_at: string | null;
  download_count: number | null;
  error_message: string | null;
}

interface DbQuotaUsage {
  usage_date: string;
  action: QuotaAction;
  count: number;
  limit_count: number;
}

interface QuotaRpcResult {
  allowed: boolean;
  used: number;
  limit_count: number;
}

export interface ListRecordsOptions {
  limit?: number;
  fromDate?: string;
  toDate?: string;
  status?: RecordStatus;
}

export interface NewMedicalRecordInput {
  id: string;
  ipNumber: string | null;
  patientName: string | null;
  doctorName: string | null;
  sections: string[];
  fileName: string;
  contentType: string;
  sizeBytes: number;
  storageProvider: StorageProviderName;
  bucket: string;
  objectKey: string;
  status: RecordStatus;
  source: RecordSource;
  recordDate: string;
  errorMessage?: string | null;
}

export function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!url || !serviceRoleKey) {
    throw new SupabaseConfigurationError(
      "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return { url, serviceRoleKey };
}

export function getSupabaseBucket() {
  return process.env.SUPABASE_STORAGE_BUCKET || "medical-records";
}

export function getStorageQuotaBytes() {
  const value = Number(process.env.STORAGE_QUOTA_BYTES);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_STORAGE_QUOTA_BYTES;
}

export async function supabaseRest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const config = getSupabaseConfig();
  const headers = new Headers(init.headers);

  headers.set("apikey", config.serviceRoleKey);
  headers.set("Authorization", `Bearer ${config.serviceRoleKey}`);

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${config.url}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
  const text = await response.text();

  if (!response.ok) {
    throw new Error(
      `Supabase request failed (${response.status}): ${text || response.statusText}`
    );
  }

  if (!text) {
    return null as T;
  }

  return JSON.parse(text) as T;
}

export async function listRecords(options: ListRecordsOptions = {}) {
  const params = new URLSearchParams({
    select: "*",
    order: "uploaded_at.desc",
    limit: String(Math.min(Math.max(options.limit ?? 500, 1), 5000)),
  });

  if (options.fromDate) {
    params.set("record_date", `gte.${options.fromDate}`);
  }

  if (options.toDate) {
    params.append("record_date", `lte.${options.toDate}`);
  }

  if (options.status) {
    params.set("status", `eq.${options.status}`);
  }

  const rows = await supabaseRest<DbMedicalRecord[]>(
    `/rest/v1/medical_records?${params.toString()}`
  );

  return rows.map(mapMedicalRecord);
}

export async function getRecordById(id: string) {
  const params = new URLSearchParams({
    select: "*",
    id: `eq.${id}`,
    limit: "1",
  });
  const rows = await supabaseRest<DbMedicalRecord[]>(
    `/rest/v1/medical_records?${params.toString()}`
  );

  return rows[0] ? mapMedicalRecord(rows[0]) : null;
}

export async function createRecord(input: NewMedicalRecordInput) {
  const rows = await supabaseRest<DbMedicalRecord[]>("/rest/v1/medical_records", {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      id: input.id,
      ip_number: blankToNull(input.ipNumber),
      patient_name: blankToNull(input.patientName),
      doctor_name: blankToNull(input.doctorName),
      sections: normalizeSections(input.sections),
      file_name: input.fileName,
      content_type: input.contentType,
      size_bytes: input.sizeBytes,
      storage_provider: input.storageProvider,
      bucket: input.bucket,
      object_key: input.objectKey,
      status: input.status,
      source: input.source,
      record_date: input.recordDate,
      error_message: input.errorMessage ?? null,
    }),
  });

  return mapMedicalRecord(rows[0]);
}

export async function updateRecordMetadata(id: string, update: MedicalRecordUpdate) {
  const body: Partial<DbMedicalRecord> = {
    updated_at: new Date().toISOString(),
  } as Partial<DbMedicalRecord>;

  if ("ipNumber" in update) {
    body.ip_number = blankToNull(update.ipNumber);
  }

  if ("patientName" in update) {
    body.patient_name = blankToNull(update.patientName);
  }

  if ("doctorName" in update) {
    body.doctor_name = blankToNull(update.doctorName);
  }

  if ("sections" in update) {
    body.sections = normalizeSections(update.sections);
  }

  if ("recordDate" in update && update.recordDate) {
    body.record_date = isValidDateInput(update.recordDate)
      ? update.recordDate
      : formatDateInputValue(new Date(update.recordDate));
  }

  const params = new URLSearchParams({ id: `eq.${id}` });
  const rows = await supabaseRest<DbMedicalRecord[]>(
    `/rest/v1/medical_records?${params.toString()}`,
    {
      method: "PATCH",
      headers: {
        Prefer: "return=representation",
      },
      body: JSON.stringify(body),
    }
  );

  return rows[0] ? mapMedicalRecord(rows[0]) : null;
}

export async function consumeDailyQuota(
  action: QuotaAction,
  limit: number,
  amount = 1,
  date = getDateKey()
) {
  const result = await supabaseRest<QuotaRpcResult[] | QuotaRpcResult>(
    "/rest/v1/rpc/consume_daily_quota",
    {
      method: "POST",
      body: JSON.stringify({
        p_action: action,
        p_limit: limit,
        p_amount: amount,
        p_usage_date: date,
      }),
    }
  );
  const row = Array.isArray(result) ? result[0] : result;

  return {
    allowed: Boolean(row?.allowed),
    used: Number(row?.used ?? 0),
    limit: Number(row?.limit_count ?? limit),
    date,
    action,
  };
}

export async function releaseDailyQuota(
  action: QuotaAction,
  amount = 1,
  date = getDateKey()
) {
  await supabaseRest("/rest/v1/rpc/release_daily_quota", {
    method: "POST",
    body: JSON.stringify({
      p_action: action,
      p_amount: amount,
      p_usage_date: date,
    }),
  });
}

export async function getDailyUsage(
  action: QuotaAction,
  limit = action === "upload" ? UPLOAD_DAILY_LIMIT : DOWNLOAD_DAILY_LIMIT,
  date = getDateKey()
): Promise<QuotaUsage> {
  const params = new URLSearchParams({
    select: "*",
    usage_date: `eq.${date}`,
    action: `eq.${action}`,
    limit: "1",
  });
  const rows = await supabaseRest<DbQuotaUsage[]>(`/rest/v1/daily_usage?${params.toString()}`);
  const usage = rows[0];

  return {
    action,
    date,
    used: usage?.count ?? 0,
    limit: usage?.limit_count ?? limit,
  };
}

export async function incrementRecordDownload(id: string) {
  await supabaseRest("/rest/v1/rpc/increment_record_download", {
    method: "POST",
    body: JSON.stringify({ p_record_id: id }),
  });
}

function mapMedicalRecord(row: DbMedicalRecord): MedicalRecord {
  return {
    id: row.id,
    ipNumber: row.ip_number,
    patientName: row.patient_name,
    doctorName: row.doctor_name,
    sections: normalizeSections(row.sections),
    fileName: row.file_name,
    contentType: row.content_type,
    sizeBytes: Number(row.size_bytes),
    storageProvider: row.storage_provider === "s3" ? "s3" : "supabase",
    bucket: row.bucket,
    objectKey: row.object_key,
    status: isRecordStatus(row.status) ? row.status : "Synced",
    source: row.source === "folder-sync" ? "folder-sync" : "manual",
    recordDate: row.record_date,
    uploadedAt: row.uploaded_at,
    updatedAt: row.updated_at,
    lastDownloadedAt: row.last_downloaded_at,
    downloadCount: row.download_count ?? 0,
    errorMessage: row.error_message,
  };
}

function blankToNull(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}
