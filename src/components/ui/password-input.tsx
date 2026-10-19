"use client";
import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "./input";

/** Campo de contraseña con un ojito para ver lo que se escribe. Empieza oculto y no deja que el teclado corrija ni ponga mayúsculas. */
function PasswordInput({ className, ...p }: Omit<React.ComponentProps<typeof Input>, "type">) {
  const [ver, setVer] = React.useState(false);
  return (
    <div className="relative">
      <Input {...p} type={ver ? "text" : "password"} autoCapitalize="none" autoCorrect="off" spellCheck={false} className={cn("pr-11", className)} />
      <button type="button" onClick={() => setVer((v) => !v)} aria-pressed={ver} aria-label={ver ? "Ocultar la contraseña" : "Mostrar la contraseña"} title={ver ? "Ocultar la contraseña" : "Mostrar la contraseña"}
        className="absolute right-1 top-1/2 grid size-8 -translate-y-1/2 cursor-pointer place-items-center rounded-md text-muted-foreground outline-none transition hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40">
        {ver ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
      </button>
    </div>
  );
}
export { PasswordInput };
