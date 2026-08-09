import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  useSuspenseQuery,
  useQueryClient,
  queryOptions,
  keepPreviousData,
} from "@tanstack/react-query";
import { useState, useRef, useCallback, type DragEvent } from "react";
import {
  FileArchive,
  Upload,
  FileText,
  Image as ImageIcon,
  File as FileIcon,
  Download,
  Loader2,
  ChevronDown,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import {
  listUploads,
  getSignedUrl,
  type UploadSummary,
  type UploadFileSummary,
} from "@/lib/zip.functions";

const uploadsQuery = queryOptions({
  queryKey: ["uploads"],
  queryFn: () => listUploads(),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "ZIP Explorer — upload e extração de ficheiros",
      },
      {
        name: "description",
        content:
          "Carregue um ficheiro ZIP, extraia automaticamente o seu conteúdo e visualize os ficheiros com pré-visualização de texto e imagens.",
      },
      { property: "og:title", content: "ZIP Explorer — upload e extração" },
      {
        property: "og:description",
        content:
          "Carregue um ZIP, extraia automaticamente e visualize os ficheiros com pré-visualização.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(uploadsQuery),
  component: Index,
});

function Index() {
  const { data } = useSuspenseQuery(uploadsQuery);
  const queryClient = useQueryClient();

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      if (!file) return;
      if (!file.name.toLowerCase().endsWith(".zip")) {
        setError("Apenas se aceitam ficheiros .zip");
        return;
      }
      setError(null);
      setIsUploading(true);
      setProgress(10);
      try {
        const formData = new FormData();
        formData.append("file", file);

        setProgress(30);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        setProgress(90);
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json?.error ?? "Falha no upload");
        }
        setProgress(100);
        await queryClient.invalidateQueries({ queryKey: ["uploads"] });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha no upload");
      } finally {
        setIsUploading(false);
        setTimeout(() => setProgress(0), 800);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [queryClient],
  );

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    void handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:py-16">
        <header className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <FileArchive className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                ZIP Explorer
              </h1>
              <p className="text-sm text-muted-foreground">
                Carregue um ZIP, extraia e visualize o seu conteúdo.
              </p>
            </div>
          </div>
        </header>

        {/* Dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-accent/40"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip,application/zip"
            className="hidden"
            onChange={(e) => void handleFiles(e.target.files)}
          />
          {isUploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium">A extrair o ZIP…</p>
              {progress > 0 && (
                <div className="mt-1 h-1.5 w-48 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">
                Arraste um ficheiro .zip aqui ou clique para selecionar
              </p>
              <p className="text-xs text-muted-foreground">
                Máximo 20 MB · até 200 ficheiros
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Uploads list */}
        <div className="mt-10">
          <h2 className="mb-4 text-lg font-semibold">
            Uploads{" "}
            <span className="text-muted-foreground">
              ({data.uploads.length})
            </span>
          </h2>
          {data.uploads.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Ainda não há uploads. Carregue o seu primeiro ZIP acima.
            </p>
          ) : (
            <div className="space-y-3">
              {data.uploads.map((upload) => (
                <UploadCard key={upload.id} upload={upload} />
              ))}
            </div>
          )}
        </div>

        <footer className="mt-16 border-t pt-6 text-center text-xs text-muted-foreground">
          Ficheiros guardados no Lovable Cloud.
        </footer>
      </div>
    </div>
  );
}

function UploadCard({ upload }: { upload: UploadSummary }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/40"
      >
        {open ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <FileArchive className="h-5 w-5 shrink-0 text-primary" />
        <span className="flex-1 truncate font-medium">{upload.filename}</span>
        <span className="hidden text-sm text-muted-foreground sm:inline">
          {upload.fileCount} ficheiro{upload.fileCount === 1 ? "" : "s"}
        </span>
        <span className="text-xs text-muted-foreground">
          {new Date(upload.createdAt).toLocaleString("pt-PT", {
            dateStyle: "short",
            timeStyle: "short",
          })}
        </span>
      </button>
      {open && (
        <div className="border-t">
          {upload.files.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              Sem ficheiros.
            </p>
          ) : (
            <ul className="divide-y">
              {upload.files.map((file) => (
                <FileRow key={file.id} file={file} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function FileRow({ file }: { file: UploadFileSummary }) {
  const fetchSigned = useServerFn(getSignedUrl);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);

  const isImage = file.mimeType.startsWith("image/");
  const isText =
    file.previewText !== null ||
    file.mimeType.startsWith("text/") ||
    file.mimeType === "application/json" ||
    file.mimeType === "application/x-ndjson";

  const loadUrl = async () => {
    setLoadingUrl(true);
    try {
      const { url } = await fetchSigned({ data: { storagePath: file.storagePath } });
      setPreviewUrl(url);
    } catch {
      setPreviewUrl(null);
    } finally {
      setLoadingUrl(false);
    }
  };

  return (
    <li className="px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0 text-muted-foreground">
          {isImage ? (
            <ImageIcon className="h-4 w-4" />
          ) : isText ? (
            <FileText className="h-4 w-4" />
          ) : (
            <FileIcon className="h-4 w-4" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-sm">{file.path}</p>
          <p className="text-xs text-muted-foreground">
            {formatBytes(file.sizeBytes)} · {file.mimeType}
          </p>

          {/* Text preview */}
          {isText && file.previewText && (
            <pre className="mt-2 max-h-72 overflow-auto rounded-lg bg-muted/50 p-3 text-xs leading-relaxed whitespace-pre-wrap break-words">
              {file.previewText}
            </pre>
          )}

          {/* Image preview */}
          {isImage && (
            <div className="mt-2">
              {!previewUrl ? (
                <button
                  onClick={() => void loadUrl()}
                  disabled={loadingUrl}
                  className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent disabled:opacity-60"
                >
                  {loadingUrl ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ImageIcon className="h-3.5 w-3.5" />
                  )}
                  Pré-visualizar imagem
                </button>
              ) : (
                <img
                  src={previewUrl}
                  alt={file.filename}
                  className="mt-1 max-h-96 rounded-lg border"
                  loading="lazy"
                />
              )}
            </div>
          )}

          {/* Download link for non-text / non-image */}
          {!isText && !isImage && (
            <div className="mt-2">
              {!previewUrl ? (
                <button
                  onClick={() => void loadUrl()}
                  disabled={loadingUrl}
                  className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent disabled:opacity-60"
                >
                  {loadingUrl ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  Gerar link de download
                </button>
              ) : (
                <a
                  href={previewUrl}
                  download={file.filename}
                  className="inline-flex items-center gap-2 text-xs font-medium text-primary hover:underline"
                >
                  <Download className="h-3.5 w-3.5" />
                  Transferir ficheiro
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

// silence unused import in some build configs
void keepPreviousData;
