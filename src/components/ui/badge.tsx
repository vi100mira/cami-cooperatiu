import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const badgeVariants = cva("inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold [&_svg]:size-3", {
  variants: { variant: {
    default: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-muted-foreground",
    soft: "bg-accent text-accent-foreground",
    warning: "bg-sun-soft text-sun",
    success: "bg-good-soft text-good",
    danger: "bg-bad-soft text-destructive",
    outline: "border text-muted-foreground",
  } },
  defaultVariants: { variant: "secondary" },
});
function Badge({ className, variant, ...p }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) { return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...p} />; }
export { Badge, badgeVariants };
