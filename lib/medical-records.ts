export const UPLOAD_DAILY_LIMIT = 150;
export const DOWNLOAD_DAILY_LIMIT = 20;
export const MAX_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024;
export const DEFAULT_STORAGE_QUOTA_BYTES = 5 * 1024 ** 4;

export const DEFAULT_SECTION_CATALOG = [
  {
    id: "cardiovascular",
    name: "Cardiovascular",
    iconName: "Heart",
    description: "ECG reports, angiograms, cardiac surgery history, and general heart care records.",
  },
  {
    id: "c-section",
    name: "C-Section",
    iconName: "Baby",
    description: "Delivery notes, fetal monitoring, prenatal logs, and maternity surgical records.",
  },
  {
    id: "neurology",
    name: "Neurology",
    iconName: "Brain",
    description: "EEG readings, brain scans, stroke history, and nerve conduction assessments.",
  },
  {
    id: "pediatrics",
    name: "Pediatrics",
    iconName: "Baby",
    description: "Childhood vaccinations, growth charts, pediatric lab results, and neonatal check-ups.",
  },
  {
    id: "orthopedics",
    name: "Orthopedics",
    iconName: "Bone",
    description: "Fracture treatment logs, MRI scans of joints, physiotherapy plans, and orthopedic post-op care.",
  },
  {
    id: "oncology",
    name: "Oncology",
    iconName: "Dna",
    description: "Chemotherapy tracking sheets, tumor biopsy reports, and genetic counseling records.",
  },
] as const;

export type RecordStatus = "Synced" | "Uploading" | "Failed";
export type RecordSource = "manual" | "folder-sync";
export type StorageProviderName = "supabase" | "s3";
export type QuotaAction = "upload" | "download";

export interface MedicalRecord {
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
  uploadedAt: string;
  updatedAt: string;
  lastDownloadedAt: string | null;
  downloadCount: number;
  errorMessage: string | null;
}

export interface MedicalRecordUpdate {
  ipNumber?: string | null;
  patientName?: string | null;
  doctorName?: string | null;
  sections?: string[];
  recordDate?: string;
}

export interface QuotaUsage {
  action: QuotaAction;
  date: string;
  used: number;
  limit: number;
}

export interface DashboardHistoryPoint {
  name: string;
  date: string;
  uploads: number;
  downloads: number;
}

export interface DashboardActivity {
  time: string;
  event: string;
  status: "success" | "error" | "info";
  source: string;
}

export interface DashboardSummary {
  totalRecords: number;
  uploadedToday: number;
  uploadedThisWeek: number;
  downloadsToday: number;
  uploadLimit: number;
  downloadLimit: number;
  storageUsedBytes: number;
  storageQuotaBytes: number;
  history: DashboardHistoryPoint[];
  recentActivity: DashboardActivity[];
  uploadUsage: QuotaUsage;
  downloadUsage: QuotaUsage;
}

export interface SectionSummary {
  id: string;
  name: string;
  iconName: string;
  description: string;
  recordsCount: number;
}

export function normalizeSections(input: unknown): string[] {
  const values = Array.isArray(input)
    ? input
    : typeof input === "string"
      ? input.split(",")
      : [];

  return Array.from(
    new Set(
      values
        .map((value) => String(value).trim())
        .filter(Boolean)
    )
  ).slice(0, 12);
}

export function displayRecordValue(value: string | null | undefined, fallback = "Unassigned") {
  return value?.trim() ? value : fallback;
}

export function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;

  return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`;
}

export function formatRecordDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatDateInputValue(date = new Date()) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return offsetDate.toISOString().slice(0, 10);
}

export function isValidDateInput(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function isRecordStatus(value: string): value is RecordStatus {
  return value === "Synced" || value === "Uploading" || value === "Failed";
}
