/** Preguntas frecuentes sobre cooperativas de vivienda en cesión de uso. Orientativo: los estatutos y la entidad financiera mandan. */
export interface Faq { g: string; q: string; a: string }

export const FAQ: Faq[] = [
  // Financiación
  { g: "Financiación", q: "¿Quién pide el préstamo: cada familia o la cooperativa?",
    a: "Lo pide la cooperativa, como entidad colectiva (en el sector se llama préstamo promotor). No es una hipoteca por familia como en una compra individual: el banco concede un único préstamo para el suelo y la obra, y lo devuelve la cooperativa con las {{cuota|cuotas mensuales}} de todas las viviendas.\n\nPor eso el préstamo es del grupo y las decisiones sobre él (cuánto pedir, a qué entidad, con qué plazo) las toma la asamblea." },
  { g: "Financiación", q: "¿Hay que avalar el préstamo con el patrimonio personal?",
    a: "Lo habitual es que la garantía principal sea el propio inmueble y la cooperativa, no la casa o los ahorros de cada persona socia. Aun así depende de la entidad: algunas piden garantías adicionales (por ejemplo, avales de la federación, de un fondo de garantía o, en algún caso, avales de las personas socias).\n\nPregúntalo por escrito a cada entidad desde el principio y compáralo entre ofertas. Las entidades de {{banca|banca ética}} suelen conocer bien el modelo." },
  { g: "Financiación", q: "¿Cuánto aporta cada familia y cuánto pone el banco?",
    a: "El proyecto se paga con tres fuentes: la {{aportacion|aportación inicial}} de las personas socias, el préstamo y, si las hay, ayudas públicas. Como orden de magnitud, muchos proyectos cubren con fondos propios y ayudas entre una quinta parte y un tercio del coste, y el resto con préstamo; varía mucho según el proyecto y la entidad.\n\nLa aportación por familia suele ser bastante menor que la entrada de una hipoteca. Prueba con vuestras cifras en la pestaña Calculadoras." },
  { g: "Financiación", q: "Somos un grupo muy variado (jóvenes, mayores de 60, distintos tipos de familia). ¿Es un problema para el banco?",
    a: "No hay una edad máxima para ser persona socia, y como el préstamo es colectivo el banco no evalúa a cada persona como en una hipoteca individual: mira la solvencia del conjunto (ingresos del grupo, aportaciones, cuotas previstas, {{fondo|fondo de reserva}}) y la solidez del proyecto.\n\nUn grupo diverso suele ser una ventaja: reparte el riesgo y mantiene el proyecto vivo a lo largo del tiempo. Algunas entidades piden además seguros o límites de ingresos mínimos; consúltalo con ellas." },
  { g: "Financiación", q: "¿Qué pasa si una familia deja de pagar la cuota?",
    a: "Los estatutos deben prever el procedimiento: primero avisos y acuerdos de pago, y como último recurso la baja obligatoria con devolución de la aportación según las condiciones pactadas. El préstamo sigue siendo de la cooperativa, así que conviene tener un {{fondo|fondo de reserva}} que cubra impagos puntuales sin poner en riesgo al resto.\n\nDefinir esto antes de firmar evita conflictos después. Una federación te puede facilitar estatutos modelo." },

  // Salida, herencia
  { g: "Salida y herencia", q: "¿Qué pasa si una persona socia se quiere ir?",
    a: "Recupera su {{aportacion|aportación inicial}}, normalmente actualizada según lo que fijen los estatutos (por ejemplo, con el IPC) y a veces con un plazo de devolución o un preaviso. Lo que ha ido pagando de {{cuota|cuota mensual}} no se devuelve: es el coste de usar la vivienda y de devolver el préstamo del edificio, que es de la cooperativa.\n\nLa vivienda queda libre y entra otra familia, normalmente desde una lista de espera, que aporta la misma cantidad." },
  { g: "Salida y herencia", q: "¿Se puede vender o heredar la vivienda? ¿Y si fallece una persona socia?",
    a: "No se vende: el edificio es propiedad de la cooperativa para siempre, y eso es lo que evita la especulación. Tampoco se hereda como un piso en propiedad, porque lo que se tiene es un {{cesion|derecho de uso}}.\n\nLo que sí suele recogerse en los estatutos es que, si fallece una persona socia, su pareja o los hijos que conviven con ella puedan continuar en la vivienda (subrogación) y que las personas herederas recuperen la aportación. Los detalles dependen de los estatutos de cada cooperativa; léelos antes de entrar." },

  // Plazos
  { g: "Plazos", q: "¿Cuándo se puede empezar a vivir?",
    a: "Depende del camino. Rehabilitar un edificio existente suele ser más rápido (del orden de dos o tres años desde que el grupo está constituido); una obra nueva en suelo público suele tardar más (de tres a cinco años o más), porque hay que conseguir el suelo, el proyecto, la licencia, la financiación y hacer la obra.\n\nEl grupo y la ruta de esta app te ayudan a no perder tiempo, pero los plazos reales dependen de concursos, licencias y bancos. Cuenta siempre con retrasos." },

  // Comparación
  { g: "Comparación", q: "¿En qué se diferencia de comprar o de alquilar?",
    a: "Comprar: eres dueño del piso, pides una hipoteca individual con entrada grande, puedes vender y ganar o perder con el mercado. Alquilar: no pones capital, pero la cuota puede subir, el contrato es temporal y no construyes nada colectivo.\n\nCesión de uso: no eres dueño ni vendes, pero tienes derecho a vivir de forma indefinida mientras cumplas las obligaciones; aportas un capital que recuperas, pagas una cuota ajustada al coste real y participas en las decisiones de la comunidad. A cambio, hay que implicarse: asambleas, tareas y convivencia." },
];

export const FAQ_GRUPOS = Array.from(new Set(FAQ.map((f) => f.g)));
