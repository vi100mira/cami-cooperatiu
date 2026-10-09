import { cn } from "@/lib/utils";
/** Grupo de botones tipo "chip" con selección única (aria-pressed). */
export function ToggleChips<T extends string>({ value, options, onChange, label, className }: { value: T; options: [T, string][]; onChange: (v: T) => void; label: string; className?: string }) {
  return (
    <div role="group" aria-label={label} className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {options.map(([k, l]) => (
        <button key={k} type="button" aria-pressed={k === value} onClick={() => onChange(k)}
          className={cn("cursor-pointer rounded-full border px-3.5 py-1.5 text-[13px] font-medium outline-none transition focus-visible:ring-[3px] focus-visible:ring-ring/40", k === value ? "border-primary bg-primary text-primary-foreground shadow-sm" : "bg-card text-foreground hover:border-primary hover:text-primary")}>{l}</button>
      ))}
    </div>
  );
}
