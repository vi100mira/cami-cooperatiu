import * as React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
/** Desplegable nativo (<details>) con estilo: accesible y sin JavaScript. */
function Disclosure({ summary, children, className }: { summary: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <details className={cn("group rounded-lg border bg-secondary/40 px-3 py-0.5 open:bg-card", className)}>
      <summary className="flex cursor-pointer list-none items-center gap-1.5 py-2 text-[13.5px] font-semibold text-primary [&::-webkit-details-marker]:hidden">
        <ChevronRight className="size-4 transition-transform group-open:rotate-90" aria-hidden />{summary}
      </summary>
      <div className="grid gap-3 pb-3 pt-1">{children}</div>
    </details>
  );
}
export { Disclosure };
