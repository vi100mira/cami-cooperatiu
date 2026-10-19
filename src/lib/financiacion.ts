import { model, type CalcInput } from "./calc";

/**
 * Financiación sin ahorro previo. La banca (también la ética) no suele prestar el 100 % del coste: el resto se cubre
 * normalmente con la aportación inicial de las familias. Si las familias parten de cero, ese «hueco» hay que cubrirlo de
 * otra forma, y cada forma tiene su coste en la cuota. Aquí se calcula el hueco y la cuota de cada propuesta.
 * Todo son órdenes de magnitud para preparar la conversación con las entidades, no ofertas.
 */

/** Cuota mensual de un préstamo con cuota constante (sistema francés). */
export function cuotaPrestamo(importe: number, interesAnual: number, anios: number) {
  if (!(importe > 0)) return 0;
  const n = Math.max(1, Math.round(anios * 12)), r = interesAnual / 1200;
  return r === 0 ? importe / n : (importe * r) / (1 - Math.pow(1 + r, -n));
}

export interface Tramo { nombre: string; importe: number; interes: number; anios: number; pm: number }
export type IdPropuesta = "puente" | "colaboradoras" | "mixta" | "superficie" | "ayudas";
export interface Propuesta {
  id: IdPropuesta;
  titulo: string;
  /** Cómo funciona y qué hay que conseguir, en una frase. */
  como: string;
  /** Quién lo ofrece o dónde se pide (sin inventar condiciones). */
  quien: string;
  tramos: Tramo[];
  /** Coste del proyecto con esta propuesta (sin suelo si va en derecho de superficie). */
  total: number;
  /** Lo que tendría que conseguirse fuera del banco y de las familias. */
  hueco: number;
  /** Cuota de cada familia mientras se paga todo. */
  cuotaInicial: number;
  /** Cuota cuando ya se ha devuelto lo que dura menos que el préstamo del banco (null si no cambia). */
  cuotaDespues: number | null;
  /** Año desde el que se paga `cuotaDespues`. */
  desdeAnio: number | null;
  /** Cabe en el 30 % de los ingresos de la familia de la calculadora. */
  cabe: boolean;
  /** Solo para la de ayudas: subvención que haría falta para no necesitar nada más. */
  ayudaNecesaria?: number;
}

export interface Financiacion {
  viviendas: number;
  total: number;
  /** Lo que el banco prestaría como mucho con el porcentaje elegido. */
  banco: number;
  /** Lo que ponen las familias entre todas (el ahorro que sí tienen, puede ser 0). */
  familias: number;
  /** Lo que falta: ni banco, ni familias, ni ayudas. */
  hueco: number;
  /** Cuota máxima recomendable (30 % de los ingresos) de la familia de la calculadora. */
  maxq: number;
  /** Cuota si el banco prestara todo lo que falta (referencia, no suele pasar). */
  cuotaSoloBanco: number;
  propuestas: Propuesta[];
  /** La propuesta con la cuota inicial más baja que cabe en el 30 %, o null si ninguna cabe. */
  recomendada: IdPropuesta | null;
}

export function financiacionSinAhorro(c: CalcInput, fam: number): Financiacion {
  const v = Math.max(1, Math.round(+fam || 1));
  const ltv = Math.max(0, Math.min(100, +c.ltv || 0)) / 100;
  const ahorro = Math.max(0, +c.ahorro || 0);
  const subv = Math.max(0, +c.subv || 0);
  const run = (+c.mant || 0) + (+c.reserva || 0);
  const maxq = ((+c.ingresos || 0) / 12) * 0.3;
  const familias = v * ahorro;

  // El banco presta sobre el coste total (lo habitual es un porcentaje del coste o de la tasación), nunca más de lo que falta.
  const reparto = (total: number) => {
    const falta = Math.max(0, total - subv - familias);
    const banco = Math.min(falta, ltv * total);
    return { falta, banco, hueco: falta - banco };
  };

  const base = model({ ...c, aport: ahorro }, v);
  const r0 = reparto(base.total);
  const pmBanco = (importe: number) => cuotaPrestamo(importe, +c.interes || 0, +c.plazo || 0);

  const crear = (id: IdPropuesta, titulo: string, como: string, quien: string, total: number, banco: number, extra: Omit<Tramo, "pm">[], canon = 0, ayudaNecesaria?: number, hueco = 0): Propuesta => {
    const tramos: Tramo[] = [
      { nombre: "Préstamo del banco", importe: banco, interes: +c.interes || 0, anios: +c.plazo || 0, pm: pmBanco(banco) },
      ...extra.filter((t) => t.importe > 0).map((t) => ({ ...t, pm: cuotaPrestamo(t.importe, t.interes, t.anios) })),
    ].filter((t) => t.importe > 0);
    const fijo = run + canon;
    const cuotaInicial = tramos.reduce((a, t) => a + t.pm, 0) / v + fijo;
    // Lo que se devuelve antes que el préstamo del banco deja de pesar en la cuota a partir de ese año.
    const cortos = tramos.slice(1).filter((t) => t.anios < (+c.plazo || 0));
    let cuotaDespues: number | null = null, desdeAnio: number | null = null;
    if (cortos.length) {
      desdeAnio = Math.round(Math.min(...cortos.map((t) => t.anios))) + 1;
      cuotaDespues = tramos.filter((t) => t.anios >= desdeAnio!).reduce((a, t) => a + t.pm, 0) / v + fijo;
    }
    return { id, titulo, como, quien, tramos, total, hueco, cuotaInicial, cuotaDespues, desdeAnio, cabe: cuotaInicial <= maxq, ayudaNecesaria };
  };

  const h = r0.hueco;
  const puente = { nombre: "Préstamo participativo o puente", interes: +c.i2 || 0, anios: +c.p2 || 1 };
  const colab = { nombre: "Capital de personas colaboradoras", interes: +c.ic || 0, anios: +c.pc || 1 };
  const propuestas: Propuesta[] = [
    crear("puente", "Préstamo participativo o puente para el hueco",
      "Una entidad presta lo que falta, aparte del préstamo principal; las familias lo devuelven dentro de la cuota, como si pagaran la aportación a plazos.",
      "Fundaciones y finanzas éticas que apoyan la cesión de uso (La Borda firmó un préstamo participativo con La Dinamo). Pregúntalo a la banca ética y a tu federación.",
      base.total, r0.banco, [{ ...puente, importe: h }], 0, undefined, h),
    crear("colaboradoras", "Capital de personas colaboradoras",
      "Personas y entidades afines aportan dinero a la cooperativa (títulos participativos o aportaciones voluntarias al capital) a un interés bajo, y se les devuelve con el tiempo.",
      "Coop57 ha emitido títulos participativos para cooperativas de vivienda (La Borda: 865 títulos de 1.000 € al 1,75 %). Necesita una red de apoyo amplia.",
      base.total, r0.banco, [{ ...colab, importe: h }], 0, undefined, h),
    crear("mixta", "Mitad colaboradoras, mitad préstamo participativo",
      "Repartir el hueco entre las dos fuentes: se depende menos de cada una y es lo que han hecho varios proyectos reales.",
      "Combinación de las dos anteriores.",
      base.total, r0.banco, [{ ...colab, importe: h / 2 }, { ...puente, importe: h / 2 }], 0, undefined, h),
  ];

  if ((+c.suelo || 0) > 0) {
    // Suelo público cedido: no se compra el suelo; se paga, si lo hay, un canon. El hueco que quede, con colaboradoras.
    const totalSup = (+c.obra || 0) * (1 + (+c.gastos || 0) / 100);
    const rs = reparto(totalSup);
    propuestas.push(crear("superficie", "Suelo público en derecho de superficie",
      "La administración cede el suelo durante décadas: no se paga el suelo, solo la obra (y el canon, si lo hay). Lo que aun así falte, con capital de colaboradoras.",
      "Concursos de suelo para cooperativas (EVha en la Comunitat Valenciana, ayuntamientos). Ver la vía «Concurso de suelo público» en Oportunidades.",
      totalSup, rs.banco, [{ ...colab, importe: rs.hueco }], Math.max(0, +c.canon || 0), undefined, rs.hueco));
  }

  propuestas.push(crear("ayudas", "Ayudas públicas que cubran el hueco",
    "Si una subvención cubriera lo que falta, bastaría con el préstamo del banco. Sirve para saber cuánta ayuda hay que buscar.",
    "Programas autonómicos y estatales de vivienda; pregunta en la consejería y en tu federación. Pon en «Subvenciones y ayudas» lo que ya tengáis.",
    base.total, r0.banco, [], 0, h, 0));

  const validas = propuestas.filter((p) => p.cabe && p.id !== "ayudas");
  const recomendada = validas.length ? validas.reduce((a, p) => (p.cuotaInicial < a.cuotaInicial ? p : a)).id : null;
  return {
    viviendas: v, total: base.total, banco: r0.banco, familias, hueco: h, maxq,
    cuotaSoloBanco: pmBanco(r0.falta) / v + run,
    propuestas, recomendada,
  };
}
