import { StorageProviderName } from "@/lib/medical-records";
import { getSupabaseConfig } from "@/lib/server/supabase";

export interface PutObjectInput {
  bucket: string;
  key: string;
  body: Blob;
  contentType: string;
}

export interface SignedUrlInput {
  bucket: string;
  key: string;
  expiresInSeconds?: number;
  downloadFileName?: string;
}

export interface ObjectStorageProvider {
  name: StorageProviderName;
  putObject(input: PutObjectInput): Promise<void>;
  createSignedUrl(input: SignedUrlInput): Promise<string>;
}

class SupabaseStorageProvider implements ObjectStorageProvider {
  name = "supabase" as const;

  async putObject(input: PutObjectInput) {
    const config = getSupabaseConfig();
    const response = await fetch(
      `${config.url}/storage/v1/object/${encodeStorageObjectPath(input.bucket, input.key)}`,
      {
        method: "POST",
        headers: {
          apikey: config.serviceRoleKey,
          Authorization: `Bearer ${config.serviceRoleKey}`,
          "Content-Type": input.contentType,
          "Cache-Control": "3600",
          "x-upsert": "false",
        },
        body: input.body,
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(
        `Supabase storage upload failed (${response.status}): ${
          (await response.text()) || response.statusText
        }`
      );
    }
  }

  async createSignedUrl(input: SignedUrlInput) {
    const config = getSupabaseConfig();
    const response = await fetch(
      `${config.url}/storage/v1/object/sign/${encodeStorageObjectPath(input.bucket, input.key)}`,
      {
        method: "POST",
        headers: {
          apikey: config.serviceRoleKey,
          Authorization: `Bearer ${config.serviceRoleKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          expiresIn: input.expiresInSeconds ?? 300,
          download: input.downloadFileName || false,
        }),
        cache: "no-store",
      }
    );
    const text = await response.text();

    if (!response.ok) {
      throw new Error(
        `Supabase signed URL failed (${response.status}): ${text || response.statusText}`
      );
    }

    const data = JSON.parse(text) as {
      signedURL?: string;
      signedUrl?: string;
      signed_url?: string;
    };
    const signedPath = data.signedURL || data.signedUrl || data.signed_url;

    if (!signedPath) {
      throw new Error("Supabase did not return a signed URL.");
    }

    return signedPath.startsWith("http")
      ? signedPath
      : `${config.url}${signedPath.startsWith("/") ? "" : "/"}${signedPath}`;
  }
}

class S3StorageProvider implements ObjectStorageProvider {
  name = "s3" as const;

  async putObject(_input: PutObjectInput): Promise<void> {
    void _input;
    throw new Error(
      "S3 storage provider is selected but not implemented in this demo build. Add an S3 adapter behind ObjectStorageProvider before switching STORAGE_PROVIDER=s3."
    );
  }

  async createSignedUrl(_input: SignedUrlInput): Promise<string> {
    void _input;
    throw new Error(
      "S3 storage provider is selected but not implemented in this demo build. Add an S3 adapter behind ObjectStorageProvider before switching STORAGE_PROVIDER=s3."
    );
  }
}

export function getStorageProvider(providerName = getStorageProviderName()): ObjectStorageProvider {
  return providerName === "s3"
    ? new S3StorageProvider()
    : new SupabaseStorageProvider();
}

export function getStorageProviderName(): StorageProviderName {
  return process.env.STORAGE_PROVIDER === "s3" ? "s3" : "supabase";
}

function encodeStorageObjectPath(bucket: string, key: string) {
  return `${encodeURIComponent(bucket)}/${key.split("/").map(encodeURIComponent).join("/")}`;
}
