import { useState } from "react";
import { FileUp, X } from "lucide-react";
import { cn } from "../../lib/cn";

const DEFAULT_TYPES = [
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "text/plain",
  "image/png",
  "image/jpeg",
];

export function FileUpload({
  accept = ".pdf,.zip,.txt,.png,.jpg,.jpeg",
  maxSizeMb = 10,
  allowedTypes = DEFAULT_TYPES,
  onSelect,
  file,
  disabled,
}) {
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  function validate(nextFile) {
    if (!nextFile) return;
    const oversize = nextFile.size > maxSizeMb * 1024 * 1024;
    const typeOk =
      allowedTypes.includes(nextFile.type) ||
      accept.split(",").some((ext) => nextFile.name.toLowerCase().endsWith(ext.trim()));

    if (oversize) {
      setError(`File must be ${maxSizeMb} MB or smaller.`);
      onSelect(null);
      return;
    }
    if (!typeOk) {
      setError("That file type is not allowed.");
      onSelect(null);
      return;
    }

    setError("");
    onSelect(nextFile);
  }

  return (
    <div>
      <label
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-8 text-center transition",
          dragging ? "border-orange bg-orange-50" : "border-line bg-canvas hover:border-navy/30",
          disabled && "pointer-events-none opacity-60",
        )}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          validate(event.dataTransfer.files?.[0]);
        }}
      >
        <FileUp className="mb-3 text-navy" size={28} />
        <p className="text-sm font-semibold text-ink">Drop a file here, or browse</p>
        <p className="mt-1 text-xs text-muted">
          PDF, ZIP, TXT, or image · up to {maxSizeMb} MB
        </p>
        <input
          type="file"
          accept={accept}
          className="sr-only"
          disabled={disabled}
          onChange={(event) => validate(event.target.files?.[0])}
        />
      </label>

      {file ? (
        <div className="mt-3 flex items-center justify-between rounded-xl border border-line bg-white px-3 py-2 text-sm">
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{file.name}</p>
            <p className="text-xs text-muted">
              {(file.size / 1024).toFixed(1)} KB · selected, not submitted
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setError("");
              onSelect(null);
            }}
            className="rounded-lg p-1 text-muted hover:bg-canvas hover:text-ink"
            aria-label="Remove file"
          >
            <X size={16} />
          </button>
        </div>
      ) : null}

      {error ? <p className="mt-2 text-xs font-semibold text-error">{error}</p> : null}
    </div>
  );
}
