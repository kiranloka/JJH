import {
  formatDateInputValue,
  isValidDateInput,
  MedicalRecordUpdate,
  normalizeSections,
} from "@/lib/medical-records";
import { ApiError, handleRouteError } from "@/lib/server/api";
import { updateRecordMetadata } from "@/lib/server/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const update: MedicalRecordUpdate = {};

    if ("ipNumber" in body) {
      update.ipNumber = optionalString(body.ipNumber);
    }

    if ("patientName" in body) {
      update.patientName = optionalString(body.patientName);
    }

    if ("doctorName" in body) {
      update.doctorName = optionalString(body.doctorName);
    }

    if ("sections" in body) {
      update.sections = normalizeSections(body.sections);
    }

    if ("recordDate" in body) {
      update.recordDate = normalizeDate(body.recordDate);
    }

    const record = await updateRecordMetadata(id, update);

    if (!record) {
      throw new ApiError("Record not found.", 404);
    }

    return Response.json({ record });
  } catch (error) {
    return handleRouteError(error);
  }
}

function optionalString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized ? normalized : null;
}

function normalizeDate(value: unknown) {
  if (typeof value !== "string") {
    return formatDateInputValue();
  }

  if (isValidDateInput(value)) {
    return value;
  }

  return formatDateInputValue(new Date(value));
}
