// Server functions for listing the signed-in user's uploads and creating
// signed URLs for their files. All access is owner-scoped.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export interface UploadSummary {
  id: string;
  filename: string;
  sizeBytes: number;
  fileCount: number;
  createdAt: string;
  files: UploadFileSummary[];
}

export interface UploadFileSummary {
  id: string;
  path: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  previewText: string | null;
}

function mapFile(row: Record<string, unknown>): UploadFileSummary {
  return {
    id: String(row["id"]),
    path: String(row["path"]),
    filename: String(row["filename"]),
    mimeType: String(row["mime_type"]),
    sizeBytes: Number(row["size_bytes"]),
    storagePath: String(row["storage_path"]),
    previewText: (row["preview_text"] as string | null) ?? null,
  };
}

export const listUploads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;

    const { data: uploads, error } = await supabase
      .from("uploads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("listUploads error", error);
      return { uploads: [] as UploadSummary[] };
    }
    if (!uploads || uploads.length === 0) return { uploads: [] };

    const ids = uploads.map((u) => u.id);
    const { data: files } = await supabase
      .from("upload_files")
      .select("*")
      .in("upload_id", ids);

    const filesByUpload = new Map<string, UploadFileSummary[]>();
    for (const f of files ?? []) {
      const row = f as Record<string, unknown>;
      const uid = String(row["upload_id"]);
      const arr = filesByUpload.get(uid) ?? [];
      arr.push(mapFile(row));
      filesByUpload.set(uid, arr);
    }

    const result: UploadSummary[] = (uploads as Record<string, unknown>[]).map(
      (u) => ({
        id: String(u["id"]),
        filename: String(u["filename"]),
        sizeBytes: Number(u["size_bytes"]),
        fileCount: Number(u["file_count"]),
        createdAt: String(u["created_at"]),
        files: filesByUpload.get(String(u["id"])) ?? [],
      }),
    );

    return { uploads: result };
  });

export const getSignedUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ storagePath: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    // Ownership check: the row must belong to the caller (RLS enforced).
    const { data: owned } = await context.supabase
      .from("upload_files")
      .select("id")
      .eq("storage_path", data.storagePath)
      .maybeSingle();

    if (!owned) {
      throw new Error("Ficheiro não encontrado.");
    }

    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data: urlData, error } = await supabaseAdmin.storage
      .from("uploads")
      .createSignedUrl(data.storagePath, 60 * 60); // 1 hour

    if (error || !urlData?.signedUrl) {
      console.error("signed url error", error);
      throw new Error("Não foi possível gerar o link do ficheiro.");
    }
    return { url: urlData.signedUrl };
  });
