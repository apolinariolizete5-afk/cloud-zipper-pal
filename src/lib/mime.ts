// Lightweight, dependency-free MIME type guesser based on file extension.
// Pure JS, safe for the Cloudflare Worker runtime.

const MIME_BY_EXT: Record<string, string> = {
  // text
  txt: "text/plain",
  md: "text/markdown",
  csv: "text/csv",
  tsv: "text/tab-separated-values",
  html: "text/html",
  htm: "text/html",
  xml: "text/xml",
  json: "application/json",
  jsonl: "application/x-ndjson",
  log: "text/plain",
  yml: "text/yaml",
  yaml: "text/yaml",
  ini: "text/plain",
  conf: "text/plain",
  // images
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  bmp: "image/bmp",
  ico: "image/x-icon",
  avif: "image/avif",
  // documents
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  // archives
  zip: "application/zip",
  // audio / video
  mp3: "audio/mpeg",
  mp4: "video/mp4",
  wav: "audio/wav",
  // code
  js: "text/javascript",
  ts: "text/typescript",
  css: "text/css",
  py: "text/x-python",
  sh: "text/x-shellscript",
};

const TEXT_EXTS = new Set([
  "txt",
  "md",
  "csv",
  "tsv",
  "html",
  "htm",
  "xml",
  "json",
  "jsonl",
  "log",
  "yml",
  "yaml",
  "ini",
  "conf",
  "js",
  "ts",
  "css",
  "py",
  "sh",
  "svg",
]);

const IMAGE_EXTS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "bmp",
  "ico",
  "avif",
]);

export function guessMime(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXT[ext] ?? "application/octet-stream";
}

export function getExt(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

export function isTextExt(ext: string): boolean {
  return TEXT_EXTS.has(ext);
}

export function isImageExt(ext: string): boolean {
  return IMAGE_EXTS.has(ext);
}
