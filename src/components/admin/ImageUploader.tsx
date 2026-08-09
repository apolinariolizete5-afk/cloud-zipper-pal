import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { compressImage } from "@/lib/image-compress";

export function ImageUploader({
  label,
  value,
  onChange,
  maxDim = 1400,
  quality = 0.82,
  aspect = "aspect-video",
}: {
  label?: string;
  value?: string;
  onChange: (v: string | undefined) => void;
  maxDim?: number;
  quality?: number;
  aspect?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setErr(null);
    if (!file.type.startsWith("image/")) {
      setErr("Arquivo inválido — envie uma imagem.");
      return;
    }
    setBusy(true);
    try {
      const compressed = await compressImage(file, { maxDim, quality });
      // Estimate size (base64 ~ 4/3 raw)
      const approxKb = Math.round((compressed.length * 0.75) / 1024);
      if (approxKb > 800) {
        // Try harder compression pass
        const smaller = await compressImage(file, { maxDim: Math.min(maxDim, 1000), quality: 0.7 });
        onChange(smaller);
      } else {
        onChange(compressed);
      }
    } catch (e: any) {
      setErr(e?.message ?? "Falha ao processar imagem");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      {label && <p className="text-xs font-medium text-foreground/80">{label}</p>}
      <div className={`relative overflow-hidden rounded-xl border border-dashed border-border bg-muted/30 ${aspect}`}>
        {value ? (
          <>
            <img src={value} alt="pré-visualização" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(undefined)}
              className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-background/90 text-muted-foreground shadow hover:text-destructive"
              aria-label="Remover imagem"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-full w-full flex-col items-center justify-center gap-2 text-xs text-muted-foreground hover:text-primary"
          >
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
            <span>{busy ? "A comprimir..." : "Clique para enviar imagem"}</span>
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <ImagePlus className="h-3 w-3" />}
          {value ? "Substituir" : "Escolher ficheiro"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
        <span className="text-[11px] text-muted-foreground">Comprimida automaticamente</span>
      </div>
      {err && <p className="text-xs text-destructive">{err}</p>}
    </div>
  );
}