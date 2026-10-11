import { ShieldCheck } from "lucide-react";
import { Card } from "./ui/card";
import { Disclosure } from "./ui/disclosure";

/** Aviso de privacidad del sistema de grupos. Resumen siempre visible y texto completo desplegable. */
export function Privacidad() {
  return (
    <Card id="privacidad" className="gap-3">
      <div className="flex items-center gap-2 font-heading text-lg font-bold"><ShieldCheck className="size-5 text-primary" aria-hidden /> Privacidad: qué guardamos y para qué</div>
      <p className="text-sm text-muted-foreground">
        Solo si creas o entras a un grupo, guardamos <b className="text-foreground">el nombre del grupo, tu nombre o alias, contraseñas cifradas y los favoritos que marques</b>. Sirve únicamente para que las personas de tu grupo compartáis ofertas. No pedimos correo, teléfono, DNI, ingresos ni datos bancarios.
      </p>
      <Disclosure summary="Leer el aviso completo">
        <div className="grid max-w-[70ch] gap-2.5 text-sm text-muted-foreground">
          <p><b className="text-foreground">Responsable.</b> El proyecto Techo Común, una guía gratuita y sin ánimo de lucro.</p>
          <p><b className="text-foreground">Qué guardamos.</b> Del grupo: nombre, identificador y la contraseña del grupo. De cada persona: el nombre o alias que escribas (mejor sin apellidos) y su contraseña personal. De cada favorito: título, zona, precio, superficie, portal y enlace del anuncio, y la fecha en que lo marcaste. Las contraseñas se guardan solo como una huella cifrada (bcrypt): nadie, ni quien administra la base de datos, puede leerlas.</p>
          <p><b className="text-foreground">Qué no guardamos.</b> Correo, teléfono, DNI, ingresos, datos bancarios ni ubicación. Lo que rellenes en las calculadoras, la ruta y los candidatos sigue guardado solo en tu navegador.</p>
          <p><b className="text-foreground">Para qué.</b> Para identificar a tu grupo y mostrar a sus miembros los favoritos de todos, con el nombre de quien los marcó. No se usa para publicidad ni se cede a terceros.</p>
          <p><b className="text-foreground">Quién lo ve.</b> Solo quien conozca la contraseña del grupo ve los nombres y favoritos de ese grupo. Otros grupos no ven nada.</p>
          <p><b className="text-foreground">Dónde.</b> En una base de datos de Supabase alojada en la Unión Europea (París). Usamos una cookie técnica de sesión, necesaria para mantenerte dentro del grupo durante 12 horas. No es de seguimiento ni de publicidad.</p>
          <p><b className="text-foreground">Cuánto tiempo.</b> Hasta que borres tu perfil. Cuando se va la última persona de un grupo, el grupo se borra también.</p>
          <p><b className="text-foreground">Tus derechos.</b> Puedes borrar tu perfil y tus favoritos cuando quieras desde esta pestaña, con el botón «Borrar mi perfil». Con eso se eliminan todos tus datos del servidor.</p>
          <p><b className="text-foreground">Un sistema basado en confianza.</b> No hay correo ni cuentas externas: quien conozca la contraseña del grupo y la de una persona puede entrar como ella. Usa contraseñas que no utilices en ningún otro sitio. Si se pierden, no se pueden recuperar.</p>
        </div>
      </Disclosure>
    </Card>
  );
}
