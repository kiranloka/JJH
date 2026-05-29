import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import pg from "pg";

const env = await loadEnvFile(resolve(process.cwd(), ".env.local"));
const supabaseUrl = env.SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY;
const dbPassword = env.SUPABASE_DB_PASSWORD;
const bucket = env.SUPABASE_STORAGE_BUCKET || env.STORAGE_BUCKET || "medical-records";

if (!supabaseUrl || !serviceRoleKey || !dbPassword) {
  throw new Error(
    "Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or SUPABASE_DB_PASSWORD in .env.local"
  );
}

const { Pool } = pg;
const connectionString = buildConnectionString(supabaseUrl, dbPassword);
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

const sections = [
  "Cardiovascular",
  "Neurology",
  "Pediatrics",
  "Orthopedics",
  "C-Section",
  "Oncology",
];
const doctors = [
  "Dr. A. Gupta",
  "Dr. S. Mehta",
  "Dr. R. Desai",
  "Dr. M. Ali",
  "Dr. N. Iyer",
  "Dr. P. Kapoor",
];
const patients = [
  "Rahul Sharma",
  "Priya Patel",
  "Amit Kumar",
  "Sneha Reddy",
  "Vikram Singh",
  "Anjali Joshi",
  "Karan Malhotra",
  "Pooja Verma",
  "Neha Kapoor",
  "Arjun Rao",
  "Kavya Nair",
  "Ritesh Das",
];

await applySchema();
await ensureBucket();

const records = buildRecords(36);
for (const record of records) {
  await uploadPdf(record, buildDemoPdf(record));
}

await upsertRecords(records);

console.log(`Seeded ${records.length} demo medical records into ${supabaseUrl}`);
await pool.end();

async function applySchema() {
  const sql = await readFile(resolve(process.cwd(), "supabase/schema.sql"), "utf8");
  const client = await pool.connect();

  try {
    await client.query("begin");
    await client.query(sql);
    await client.query("commit");
  } catch (error) {
    await client.query("rollback").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

async function ensureBucket() {
  const response = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
    method: "POST",
    headers: headers({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      id: bucket,
      name: bucket,
      public: false,
      file_size_limit: 52428800,
      allowed_mime_types: ["application/pdf"],
    }),
  });

  if (!response.ok && response.status !== 400) {
    throw new Error(`Failed to create bucket: ${await response.text()}`);
  }
}

async function uploadPdf(record, pdfBody) {
  const response = await fetch(
    `${supabaseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${record.object_key
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`,
    {
      method: "POST",
      headers: headers({
        "Content-Type": "application/pdf",
        "x-upsert": "true",
      }),
      body: pdfBody,
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to upload ${record.file_name}: ${await response.text()}`);
  }
}

async function upsertRecords(records) {
  const response = await fetch(`${supabaseUrl}/rest/v1/medical_records?on_conflict=id`, {
    method: "POST",
    headers: headers({
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    }),
    body: JSON.stringify(records),
  });

  if (!response.ok) {
    throw new Error(`Failed to upsert demo records: ${await response.text()}`);
  }
}

function buildRecords(count) {
  const startDate = new Date("2026-04-01T00:00:00.000Z");

  return Array.from({ length: count }, (_, index) => {
    const seq = index + 1;
    const recordDate = new Date(startDate);
    recordDate.setUTCDate(startDate.getUTCDate() + index);
    const uploadedAt = new Date(recordDate);
    uploadedAt.setUTCHours(8 + (index % 9), 10 + (index % 40), 0, 0);
    const id = `00000000-0000-4000-8000-${String(seq).padStart(12, "0")}`;
    const dateKey = recordDate.toISOString().slice(0, 10);
    const fileName = `JJH_Record_${String(seq).padStart(3, "0")}.pdf`;
    const patientName = patients[index % patients.length];
    const doctorName = doctors[index % doctors.length];
    const sectionOne = sections[index % sections.length];
    const sectionTwo = sections[(index + 2) % sections.length];
    const pdfBody = buildDemoPdf({
      id,
      ip_number: `IP-2026-${String(1000 + seq)}`,
      patient_name: patientName,
      doctor_name: doctorName,
      record_date: dateKey,
    });

    return {
      id,
      ip_number: `IP-2026-${String(1000 + seq)}`,
      patient_name: patientName,
      doctor_name: doctorName,
      sections: index % 4 === 0 ? [sectionOne, sectionTwo] : [sectionOne],
      file_name: fileName,
      content_type: "application/pdf",
      size_bytes: Buffer.byteLength(pdfBody),
      storage_provider: "supabase",
      bucket,
      object_key: `${dateKey}/${id}/${fileName}`,
      status: "Synced",
      source: index % 3 === 0 ? "folder-sync" : "manual",
      record_date: dateKey,
      uploaded_at: uploadedAt.toISOString(),
      updated_at: uploadedAt.toISOString(),
      last_downloaded_at: index % 5 === 0 ? new Date(uploadedAt.getTime() + 86400000).toISOString() : null,
      download_count: index % 5 === 0 ? 1 + (index % 3) : 0,
      error_message: null,
    };
  });
}

function buildDemoPdf(record) {
  return `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length 220 >>
stream
BT
/F1 22 Tf
72 720 Td
(JJ Hospital Demo Medical Record) Tj
0 -34 Td
/F1 14 Tf
(Record ID: ${escapePdf(record.id)}) Tj
0 -22 Td
(IP Number: ${escapePdf(record.ip_number)}) Tj
0 -22 Td
(Patient: ${escapePdf(record.patient_name)}) Tj
0 -22 Td
(Doctor: ${escapePdf(record.doctor_name)}) Tj
0 -22 Td
(Medical Record Date: ${escapePdf(record.record_date)}) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000241 00000 n 
0000000311 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
620
%%EOF`;
}

function escapePdf(value) {
  return String(value ?? "").replace(/[()\\]/g, "\\$&");
}

function headers(extra = {}) {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    ...extra,
  };
}

function buildConnectionString(supabaseUrlValue, password) {
  const projectRef = new URL(supabaseUrlValue).hostname.replace(/\.supabase\.co$/, "");
  const host = `db.${projectRef}.supabase.co`;

  return `postgresql://postgres:${encodeURIComponent(password)}@${host}:5432/postgres`;
}

async function loadEnvFile(path) {
  const content = await readFile(path, "utf8");
  const result = {};

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf("=");

    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    result[key] = stripQuotes(value);
  }

  return result;
}

function stripQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}
