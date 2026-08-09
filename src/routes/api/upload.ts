// Raw HTTP endpoint that receives a .zip upload (multipart/form-data),
// extracts it on the server, stores the files in Lovable Cloud Storage,
// and records metadata in the database. App-internal — called from the
// browser via fetch with FormData.
import { createFileRoute } from "@tanstack/react-router";
import { extractZip, formatBytes, type ExtractedFile } from "@/lib/zip.server";
import { guessMime } from "@/lib/mime";

const MAX_ZIP_BYTES = 20 * 1024 * 1024; // 20 MB

interface StoredFile {
  id: string;
  path: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  previewText: string | null;
}

export const Route = createFileRoute("/api/upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Uploads are owner-scoped: a valid Supabase bearer token is required.
        const authHeader = request.headers.get("Authorization") ?? "";
        const token = authHeader.toLowerCase().startsWith("bearer ")
          ? authHeader.slice(7).trim()
          : "";
        if (!token) {
          return json({ error: "Autenticação necessária." }, 401);
        }

        const { createClient } = await import("@supabase/supabase-js");
        const authClient = createClient(
          process.env["SUPABASE_URL"]!,
          process.env["SUPABASE_PUBLISHABLE_KEY"] ??
            process.env["SUPABASE_ANON_KEY"]!,
          { auth: { persistSession: false, autoRefreshToken: false } },
        );
        const { data: userData, error: userErr } =
          await authClient.auth.getUser(token);
        const userId = userData?.user?.id;
        if (userErr || !userId) {
          return json({ error: "Sessão inválida." }, 401);
        }

        let formData: FormData;
        try {
          formData = await request.formData();
        } catch {
          return json({ error: "Esperado multipart/form-data." }, 400);
        }


        const file = formData.get("file");
        if (!(file instanceof File)) {
          return json({ error: "Nenhum ficheiro enviado no campo 'file'." }, 400);
        }
        if (!file.name.toLowerCase().endsWith(".zip")) {
          return json({ error: "Apenas ficheiros .zip são aceites." }, 400);
        }
        if (file.size > MAX_ZIP_BYTES) {
          return json(
            {
              error: `ZIP demasiado grande (máximo ${formatBytes(MAX_ZIP_BYTES)}).`,
            },
            413,
          );
        }

        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );

        let zipBytes: Uint8Array;
        try {
          zipBytes = new Uint8Array(await file.arrayBuffer());
        } catch {
          return json({ error: "Não foi possível ler o ficheiro." }, 400);
        }

        let extracted: { files: ExtractedFile[]; totalSize: number };
        try {
          extracted = extractZip(zipBytes);
        } catch (err) {
          return json(
            {
              error:
                err instanceof Error
                  ? err.message
                  : "Falha ao extrair o ZIP.",
            },
            422,
          );
        }

        if (extracted.files.length === 0) {
          return json({ error: "O ZIP não contém ficheiros." }, 422);
        }

        // Insert the upload row first.
        const { data: uploadRow, error: uploadErr } = await supabaseAdmin
          .from("uploads")
          .insert({
            filename: file.name,
            size_bytes: file.size,
            file_count: extracted.files.length,
            user_id: userId,
          })
          .select("id")
          .single();

        if (uploadErr || !uploadRow) {
          console.error("upload insert error", uploadErr);
          return json({ error: "Falha ao registar o upload." }, 500);
        }

        const uploadId = uploadRow.id as string;
        const stored: StoredFile[] = [];

        for (const f of extracted.files) {
          const storagePath = `${userId}/${uploadId}/${f.path}`;
          const body = f.bytes
            ? new Blob([f.bytes as unknown as BlobPart], { type: f.mimeType })
            : null;
          if (!body) continue;

          const { error: upErr } = await supabaseAdmin.storage
            .from("uploads")
            .upload(storagePath, body, {
              contentType: f.mimeType,
              upsert: false,
            });

          if (upErr) {
            console.error("storage upload error", upErr, storagePath);
            // continue with remaining files rather than failing the whole upload
            continue;
          }

          const { data: fileRow, error: fileErr } = await supabaseAdmin
            .from("upload_files")
            .insert({
              upload_id: uploadId,
              path: f.path,
              filename: f.filename,
              mime_type: f.mimeType,
              size_bytes: f.sizeBytes,
              storage_path: storagePath,
              preview_text: f.previewText,
            })
            .select("id")
            .single();

          if (fileErr || !fileRow) {
            console.error("file insert error", fileErr, f.path);
            continue;
          }

          stored.push({
            id: fileRow.id as string,
            path: f.path,
            filename: f.filename,
            mimeType: f.mimeType,
            sizeBytes: f.sizeBytes,
            storagePath: storagePath,
            previewText: f.previewText,
          });
        }

        return json({
          uploadId,
          filename: file.name,
          fileCount: stored.length,
          files: stored,
        });
      },
    },
  },
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// silence unused import in some build paths
void guessMime;
