import { ShieldCheck } from "lucide-react";
import { Card } from "./ui/card";
import { Disclosure } from "./ui/disclosure";

const RESPONSABLE = "Leida cooperativa";
const CONTACTO = "pilarleida@gmail.com";

/** Aviso de privacidad del sistema de grupos. Resumen siempre visible y texto completo desplegable. */
export function Privacidad() {
  return (
    <Card id="privacidad" className="gap-3">
      <div className="flex items-center gap-2 font-heading text-lg font-bold"><ShieldCheck className="size-5 text-primary" aria-hidden /> Privacidad: qué guardamos y para qué</div>
      <p className="text-sm text-muted-foreground">
        Solo si creas o entras a un grupo, guardamos <b className="text-foreground">el nombre del grupo, tu nombre o alias, contraseñas cifradas y los favoritos que marques</b>. Sirve únicamente para que las personas de tu grupo compartáis ofertas. No pedimos correo, teléfono, DNI, ingresos ni datos bancarios. Responsable: {RESPONSABLE}.
      </p>
      <Disclosure summary="Leer el aviso completo">
        <div className="grid max-w-[70ch] gap-2.5 text-sm text-muted-foreground">
          <p><b className="text-foreground">Responsable.</b> {RESPONSABLE}. Contacto: <a className="font-semibold text-primary underline" href={`mailto:${CONTACTO}`}>{CONTACTO}</a>.</p>
          <div className="grid gap-1.5">
            <p><b className="text-foreground">Qué datos tratamos.</b> Solo si creas o entras a un grupo:</p>
            <ul className="grid list-disc gap-1 pl-5">
              <li>el nombre del grupo y su identificador;</li>
              <li>el nombre o alias de cada persona (mejor sin apellidos);</li>
              <li>las contraseñas, únicamente como huella cifrada, nunca en texto plano;</li>
              <li>los favoritos que marques: título, zona, precio, superficie, portal, enlace del anuncio y fecha;</li>
              <li>la fecha de la última actividad del grupo (la última vez que alguien entró o marcó un favorito).</li>
            </ul>
            <p>Usamos además una cookie técnica de sesión de 12 horas, necesaria para mantenerte dentro del grupo. No es de seguimiento ni de publicidad. No guardamos correo, teléfono, DNI, ingresos, datos bancarios ni ubicación. Lo que rellenes en la ruta, las calculadoras y los candidatos se queda en tu navegador y no llega a nosotros.</p>
          </div>
          <p><b className="text-foreground">Para qué.</b> Identificar a tu grupo y mostrar a sus miembros los favoritos de todos, con el nombre de quien los marcó. No hacemos perfiles ni decisiones automatizadas, no hay publicidad y no cedemos datos a terceros.</p>
          <p><b className="text-foreground">Base jurídica.</b> Tu consentimiento (art. 6.1.a del RGPD), que das al marcar la casilla al crear un grupo o al añadirte a uno. Puedes retirarlo en cualquier momento borrando tu perfil.</p>
          <p><b className="text-foreground">Proveedores.</b> Supabase aloja la base de datos en la Unión Europea (París) y Vercel aloja la web. Ambos tratan datos por nuestra cuenta. Vercel es una empresa estadounidense, por lo que puede haber transferencias internacionales de datos. Tanto Vercel como Supabase recogen en sus contratos de encargado del tratamiento las cláusulas contractuales tipo de la Comisión Europea (Decisión de Ejecución (UE) 2021/914) como garantía para esas transferencias.</p>
          <p><b className="text-foreground">Cuánto tiempo.</b> Hasta que borres tu perfil. Cuando se va la última persona de un grupo, el grupo se borra también. No hay un plazo automático de caducidad: nada se borra solo. Como anotamos la fecha de la última actividad, el responsable puede borrar a mano los grupos que lleven mucho tiempo sin usarse.</p>
          <p><b className="text-foreground">Tus derechos.</b> Acceso, rectificación, supresión, oposición, limitación y portabilidad. La supresión la haces tú desde la pestaña «Grupo», con «Borrar mi perfil». Para los demás derechos, escribe a <a className="font-semibold text-primary underline" href={`mailto:${CONTACTO}`}>{CONTACTO}</a>. Si crees que no hemos tratado bien tus datos, puedes reclamar ante la <a className="font-semibold text-primary underline" href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">Agencia Española de Protección de Datos</a>.</p>
          <p><b className="text-foreground">Un sistema basado en confianza.</b> No hay correo ni cuentas externas: quien conozca la contraseña del grupo y la de una persona entra como ella. Usa contraseñas que no utilices en otros sitios. Si se pierden, no se pueden recuperar.</p>
        </div>
      </Disclosure>
    </Card>
  );
}
