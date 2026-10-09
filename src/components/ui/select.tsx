import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
/** Select nativo con estilo shadcn: mantiene el teclado y el selector del móvil. */
function NativeSelect({ className, children, ...p }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select data-slot="select" className={cn("h-10 w-full min-w-0 cursor-pointer appearance-none rounded-lg border border-input bg-card pl-3 pr-9 text-sm shadow-xs outline-none transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/25", className)} {...p}>{children}</select>
      <ChevronDown aria-hidden className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}
export { NativeSelect };
