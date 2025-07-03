"use client";
import * as React from "react";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { cn } from "~/lib/utils";

interface Option {
  label: string;
  value: string;
}

interface MultiSelectComboboxProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

export function MultiSelectCombobox({
  options,
  value,
  onChange,
  placeholder = "Válassz...",
  label,
  className = "",
}: MultiSelectComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Outside click handler
  React.useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const filtered = options.filter(opt =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      {label && <div className="mb-1 text-sm font-medium">{label}</div>}
      <button
        type="button"
        className={cn(
          "flex w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-left text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring",
          value.length === 0 && "text-muted-foreground"
        )}
        onClick={() => setOpen((o) => !o)}
      >
        <span>
          {value.length === 0
            ? placeholder
            : options
                .filter((opt) => value.includes(opt.value))
                .map((opt) => opt.label)
                .join(", ")}
        </span>
        <ChevronDownIcon className="ml-2 h-4 w-4 opacity-50" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
          <div className="p-2">
            <input
              type="text"
              className="w-full rounded border px-2 py-1 text-sm mb-2"
              placeholder="Keresés..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
            <div className="max-h-48 overflow-y-auto">
              {filtered.length === 0 && (
                <div className="p-2 text-muted-foreground text-sm">Nincs találat</div>
              )}
              {filtered.map(opt => (
                <label
                  key={opt.value}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-accent",
                    value.includes(opt.value) && "bg-accent"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={value.includes(opt.value)}
                    onChange={() => {
                      if (value.includes(opt.value)) {
                        onChange(value.filter(v => v !== opt.value));
                      } else {
                        onChange([...value, opt.value]);
                      }
                    }}
                    className="accent-primary"
                  />
                  <span className="flex-1">{opt.label}</span>
                  {value.includes(opt.value) && <CheckIcon className="h-4 w-4 text-primary" />}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 