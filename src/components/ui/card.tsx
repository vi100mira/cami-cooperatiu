import * as React from "react";
import { cn } from "@/lib/utils";
function Card({ className, ...p }: React.ComponentProps<"div">) { return <div data-slot="card" className={cn("flex min-w-0 flex-col gap-4 rounded-xl border bg-card p-5 text-card-foreground shadow-sm", className)} {...p} />; }
function CardHeader({ className, ...p }: React.ComponentProps<"div">) { return <div data-slot="card-header" className={cn("grid gap-1", className)} {...p} />; }
function CardTitle({ className, ...p }: React.ComponentProps<"h3">) { return <h3 data-slot="card-title" className={cn("font-heading text-lg font-bold leading-tight", className)} {...p} />; }
function CardDescription({ className, ...p }: React.ComponentProps<"p">) { return <p data-slot="card-description" className={cn("text-sm text-muted-foreground", className)} {...p} />; }
function CardContent({ className, ...p }: React.ComponentProps<"div">) { return <div data-slot="card-content" className={cn("grid gap-3", className)} {...p} />; }
function CardFooter({ className, ...p }: React.ComponentProps<"div">) { return <div data-slot="card-footer" className={cn("flex flex-wrap items-center gap-2", className)} {...p} />; }
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
