"use client";

import { useRef, useState } from "react";
import { UploadCloud, X, FileText, ImageIcon, AlertCircle } from "lucide-react";
import type { QuoteFile } from "@/lib/quote-wizard";

const MAX_BYTES = 25 * 1024 * 1024; // 25MB / file

type UploadItem = {
  id: string;
  name: string;
  size: number;
  isImage: boolean;
  preview?: string;
  status: "uploading" | "done" | "error";
  progress: number;
  url?: string;
  error?: string;
};

type UploadDropzoneProps = {
  files: QuoteFile[];
  onChange: (files: QuoteFile[]) => void;
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function uploadFile(file: File, onProgress: (pct: number) => void): Promise<QuoteFile> {
  return new Promise((resolve, reject) => {
    const body = new FormData();
    body.append("file", file);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");
    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    });
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as QuoteFile);
        } catch {
          reject(new Error("Răspuns invalid"));
        }
      } else {
        reject(new Error("Încărcarea a eșuat"));
      }
    });
    xhr.addEventListener("error", () => reject(new Error("Eroare de rețea")));
    xhr.send(body);
  });
}

export function UploadDropzone({ files, onChange }: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [items, setItems] = useState<UploadItem[]>(() =>
    files.map((file, index) => ({
      id: `existing-${index}-${file.url}`,
      name: file.name,
      size: file.size,
      isImage: /\.(png|jpe?g|webp|gif|heic|avif)$/i.test(file.name),
      status: "done" as const,
      progress: 100,
      url: file.url,
    })),
  );

  function syncUp(next: UploadItem[]) {
    onChange(
      next
        .filter((item) => item.status === "done" && item.url)
        .map((item) => ({ url: item.url as string, name: item.name, size: item.size })),
    );
  }

  function patch(id: string, updates: Partial<UploadItem>) {
    setItems((current) => {
      const next = current.map((item) => (item.id === id ? { ...item, ...updates } : item));
      syncUp(next);
      return next;
    });
  }

  function addFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const incoming = Array.from(fileList).map((file) => {
      const id = `${file.name}-${file.size}-${file.lastModified}-${Math.round(performance.now())}`;
      const isImage = file.type.startsWith("image/");
      const tooBig = file.size > MAX_BYTES;
      const item: UploadItem = {
        id,
        name: file.name,
        size: file.size,
        isImage,
        preview: isImage ? URL.createObjectURL(file) : undefined,
        status: tooBig ? "error" : "uploading",
        progress: 0,
        error: tooBig ? "Peste 25MB" : undefined,
      };
      return { item, file, tooBig };
    });

    setItems((current) => [...current, ...incoming.map((entry) => entry.item)]);

    for (const { item, file, tooBig } of incoming) {
      if (tooBig) continue;
      uploadFile(file, (pct) => patch(item.id, { progress: pct }))
        .then((uploaded) => patch(item.id, { status: "done", progress: 100, url: uploaded.url }))
        .catch((error: Error) => patch(item.id, { status: "error", error: error.message }));
    }
  }

  function removeItem(id: string) {
    setItems((current) => {
      const target = current.find((item) => item.id === id);
      if (target?.preview) URL.revokeObjectURL(target.preview);
      const next = current.filter((item) => item.id !== id);
      syncUp(next);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          addFiles(event.dataTransfer.files);
        }}
        className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition ${
          dragging ? "border-terracotta bg-cream" : "border-espresso/20 bg-sand/60"
        }`}
      >
        <UploadCloud size={28} className="text-terracotta" strokeWidth={1.8} />
        <p className="mt-3 font-semibold text-espresso">Trage fișierele aici</p>
        <p className="mt-1 text-sm text-espresso/55">Poze, planuri, randări — orice ne ajută.</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="btn-warm btn-warm--ghost mt-5"
        >
          Alege fișiere
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(event) => {
            addFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      {items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-xl border border-espresso/10 bg-cream p-3"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-sand">
                {item.preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.preview} alt="" className="h-full w-full object-cover" />
                ) : item.status === "error" ? (
                  <AlertCircle size={20} className="text-terracotta-deep" />
                ) : item.isImage ? (
                  <ImageIcon size={20} className="text-espresso/50" />
                ) : (
                  <FileText size={20} className="text-espresso/50" />
                )}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-espresso">{item.name}</p>
                {item.status === "error" ? (
                  <p className="text-xs text-terracotta-deep">{item.error}</p>
                ) : item.status === "uploading" ? (
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-espresso/10">
                    <div
                      className="h-full rounded-full bg-terracotta transition-all"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                ) : (
                  <p className="text-xs text-espresso/50">{formatSize(item.size)} · încărcat</p>
                )}
              </div>

              <button
                type="button"
                onClick={() => removeItem(item.id)}
                aria-label="Șterge fișierul"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-espresso/50 transition hover:bg-espresso/5 hover:text-espresso"
              >
                <X size={16} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
