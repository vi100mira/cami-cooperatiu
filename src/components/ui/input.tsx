import * as React from "react";
import { cn } from "@/lib/utils";
function Input({ className, type, ...p }: React.ComponentProps<"input">) {
  return <input type={type} data-slot="input" className={cn("h-10 w-full min-w-0 rounded-lg border border-input bg-card px-3 text-sm shadow-xs outline-none transition placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:opacity-50", className)} {...p} />;
}
function Textarea({ className, ...p }: React.ComponentProps<"textarea">) {
  return <textarea data-slot="textarea" className={cn("min-h-20 w-full min-w-0 rounded-lg border border-input bg-card px-3 py-2 text-sm leading-relaxed shadow-xs outline-none transition placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/25", className)} {...p} />;
}
export { Input, Textarea };
