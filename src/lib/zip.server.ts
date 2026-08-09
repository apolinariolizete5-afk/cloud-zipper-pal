// Server-only helpers for extracting and storing ZIP contents.
// Pure-JS decompression via fflate, compatible with the Cloudflare Worker runtime.
import { unzipSync, strFromU8 } from "fflate";
import { guessMime, getExt, isTextExt, isImageExt } from "./mime";

const MAX_ZIP_BYTES = 20 * 1024 * 1024; // 20 MB
const MAX_FILES = 200;
const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB per extracted file
const PREVIEW_CHAR_LIMIT = 8000;

export interface ExtractedFile {
  path: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  isDirectory: boolean;
  previewText: string | null;
  bytes: Uint8Array | null;
}

export interface ExtractResult {
  files: ExtractedFile[];
  totalSize: number;
}

function baseName(path: string): string {
  const parts = path.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? path;
}

export function extractZip(zipBytes: Uint8Array): ExtractResult {
  if (zipBytes.byteLength > MAX_ZIP_BYTES) {
    throw new Error(
      `ZIP demasiado grande (máximo ${MAX_ZIP_BYTES / 1024 / 1024} MB).`,
    );
  }

  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipSync(zipBytes, {
      // filter out macOS metadata + __MACOSX
      filter: (file) =>
        !file.name.includes("__MACOSX/") && !file.name.endsWith(".DS_Store"),
    });
  } catch (err) {
    throw new Error(
      `Não foi possível descomprimir o ZIP: ${err instanceof Error ? err.message : "formato inválido"}.`,
    );
  }

  const paths = Object.keys(entries);
  if (paths.length > MAX_FILES) {
    throw new Error(
      `ZIP com demasiados ficheiros (máximo ${MAX_FILES} ficheiros).`,
    );
  }

  const files: ExtractedFile[] = [];
  let totalSize = 0;

  for (const path of paths) {
    const cleanPath = path.replace(/^\.?\//, "");
    // Skip directory entries (end with /)
    if (cleanPath.endsWith("/")) continue;
    const filename = baseName(cleanPath);
    if (!filename) continue;

    const data = entries[path];
    const sizeBytes = data.byteLength;
    totalSize += sizeBytes;

    if (sizeBytes > MAX_FILE_BYTES) {
      throw new Error(
        `Ficheiro "${cleanPath}" excede o tamanho máximo por ficheiro (${MAX_FILE_BYTES / 1024 / 1024} MB).`,
      );
    }

    const ext = getExt(filename);
    const mimeType = guessMime(filename);

    let previewText: string | null = null;
    let bytes: Uint8Array | null = null;

    if (isTextExt(ext)) {
      try {
        const text = strFromU8(data);
        previewText =
          text.length > PREVIEW_CHAR_LIMIT
            ? text.slice(0, PREVIEW_CHAR_LIMIT) + "\n…"
            : text;
      } catch {
        previewText = null;
      }
      bytes = data;
    } else if (isImageExt(ext)) {
      // images: store bytes, no text preview (signed URL used in UI)
      bytes = data;
    } else {
      // other binary: store bytes for download, no preview
      bytes = data;
    }

    files.push({
      path: cleanPath,
      filename,
      mimeType,
      sizeBytes,
      isDirectory: false,
      previewText,
      bytes,
    });
  }

  return { files, totalSize };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
