import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const alertVariants = cva("flex items-start gap-2.5 rounded-lg px-3.5 py-2.5 text-[13.5px] leading-snug [&>svg]:mt-0.5 [&>svg]:size-4 [&>svg]:shrink-0", {
  variants: { variant: { info: "bg-accent text-foreground [&>svg]:text-primary", warning: "bg-sun-soft text-foreground [&>svg]:text-sun", danger: "bg-bad-soft text-foreground [&>svg]:text-destructive" } },
  defaultVariants: { variant: "info" },
});
function Alert({ className, variant, ...p }: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) { return <div role="status" data-slot="alert" className={cn(alertVariants({ variant }), className)} {...p} />; }
export { Alert };
