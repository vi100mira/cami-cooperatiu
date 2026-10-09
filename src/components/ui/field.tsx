import * as React from "react";
import { cn } from "@/lib/utils";
function Label({ className, ...p }: React.ComponentProps<"label">) { return <label data-slot="label" className={cn("flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground", className)} {...p} />; }
function Field({ label, htmlFor, children, className }: { label: React.ReactNode; htmlFor: string; children: React.ReactNode; className?: string }) {
  return <div className={cn("grid min-w-0 gap-1.5", className)}><Label htmlFor={htmlFor}>{label}</Label>{children}</div>;
}
function FormGrid({ className, ...p }: React.ComponentProps<"div">) { return <div className={cn("grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(170px,1fr))]", className)} {...p} />; }
export { Label, Field, FormGrid };
