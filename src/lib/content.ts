export interface Term{t:string;d:string;rel?:string[];link?:[string,string]}
export interface Task{id:string;t:string;go?:string;goL?:string}
export interface Phase{id:string;short:string;title:string;lead:string;hard?:string;terms:string[];ents:string[];tasks:Task[]}
export interface Scores{c:number;r:number;z:number;l:number}
export interface Via{id:string;title:string;tag:string;s:Scores;que:string;pro:string[];con:string[];ver:string;link?:{url:string;label:string;nota:string}[]}
export interface Entity{g:string;id:string;name:string;desc:string;url:string;ul:string;ct?:string[];ctn?:string;tpl?:string}
export interface Group{name:string;fam:number;barrio:string;ciudad:string;region:string}

export const TERMS:Record<string,Term>={
cesion:{t:"Cesión de uso",d:"La cooperativa es dueña del edificio para siempre. Cada persona socia recibe el derecho a vivir en una vivienda de forma indefinida mientras cumpla sus obligaciones, y paga una cuota mensual.\n\nNo se compra el piso ni se vende: si te vas, recuperas tu {{aportacion|aportación inicial}} actualizada y la vivienda vuelve a la cooperativa para el siguiente socio. Sin plusvalía, se frena la especulación.",rel:["cooperativa","aportacion","cuota"]},
cooperativa:{t:"Cooperativa de viviendas",d:"Sociedad de personas con una norma básica: un socio, un voto, en {{asamblea|asamblea}}. En cesión de uso, su objetivo es dar vivienda a las personas socias, no repartir beneficios.\n\nCuidado: muchos proyectos que se anuncian como «cooperativas de vivienda» son de propiedad y los controlan empresas privadas. Comprueba que los {{estatutos|estatutos}} fijen la {{cesion|cesión de uso}}.",rel:["cesion","estatutos","asamblea"]},
grupo:{t:"Grupo motor",d:"El núcleo inicial de personas que empuja el proyecto. No tienen que ser todas las familias futuras, pero sí compartir la necesidad, la visión y las ganas de dedicar tiempo durante años.\n\nPuede nacer de amistades, de un barrio o de un movimiento vecinal.",rel:["asamblea"]},
asamblea:{t:"Asamblea",d:"El órgano donde se decide, con un voto por persona socia. Las decisiones importantes (presupuesto, elegir el edificio, aprobar la financiación) se toman aquí. Conviene practicarla desde el primer día."},
estatutos:{t:"Estatutos",d:"Las reglas del juego: cuotas, derechos y deberes, cómo se admite a nuevos socios, cómo se transmite o hereda el derecho de uso y qué se devuelve a quien se va.\n\nRedáctalos con asesoría jurídica o apoyándote en la federación de tu comunidad (como {{fecovi|Fecovi}} en la Comunitat Valenciana), que tienen modelos.",rel:["fecovi","cesion"]},
aportacion:{t:"Aportación inicial",d:"Dinero que cada persona socia entrega al entrar. Financia parte del proyecto y suele ser bastante menor que la entrada de una hipoteca. Los estatutos fijan cuánto es y cómo se devuelve, actualizada, si alguien se va.\n\nEn la calculadora ves qué parte del coste total cubre."},
cuota:{t:"Cuota mensual",d:"Lo que paga cada vivienda al mes. Tiene tres partes: la del préstamo ({{amortizacion|amortización}}), el mantenimiento, seguros e impuestos del edificio, y el {{fondo|fondo de reserva}}.\n\nEn un concurso de la EVha, la cuota no podía superar el 30% de los ingresos de la persona socia.",rel:["amortizacion","fondo"]},
amortizacion:{t:"Amortización",d:"Devolución gradual del préstamo. Con interés fijo, cada mes pagas una cantidad constante que mezcla intereses y capital. Al acabar el plazo esa parte desaparece y la cuota baja a mantenimiento y reserva."},
fondo:{t:"Fondo de reserva",d:"Dinero que la cooperativa aparta cada mes para reparaciones grandes (fachada, ascensor, cubierta). Evita derramas sorpresa."},
superficie:{t:"Derecho de superficie",d:"Derecho a construir y explotar un edificio sobre un suelo que es de otra persona o entidad, por un plazo largo. Es la fórmula habitual cuando una administración cede suelo público a una cooperativa.\n\nEn un concurso de la {{evha|EVha}} (Comunitat Valenciana) el plazo máximo era de 75 años; al acabar, suelo y edificio vuelven a ser públicos.",rel:["evha"]},
vpo:{t:"Vivienda protegida",d:"Vivienda con precio o cuota limitados a cambio de requisitos para quien accede: un tope de ingresos, no tener otra vivienda y usarla como domicilio habitual.\n\nSi la cooperativa se levanta sobre suelo público, lo habitual es que se exijan estos requisitos. Revisa las bases de cada concurso.",rel:["iprem"]},
iprem:{t:"IPREM",d:"Indicador público de renta que se usa como vara de medir en ayudas y vivienda protegida. En un concurso de la EVha las personas socias no podían superar 4,5 veces esa referencia en renta.\n\nEl valor cambia con los años: comprueba el vigente. La calculadora usa 600 € al mes en 14 pagas solo como ejemplo."},
banca:{t:"Banca ética",d:"Entidades financieras cooperativas o con criterios sociales, como Fiare Banca Ética, Coop57 o Triodos Bank. Financian muchos proyectos de vivienda cooperativa en cesión de uso.\n\nLa banca convencional conoce poco el modelo, así que conviene ir con estatutos claros y el apoyo de una federación.",link:["Fiare Banca Ética","https://www.fiarebancaetica.coop"]},
tanteo:{t:"Tanteo y retracto",d:"Derecho de la administración a comprar con preferencia un inmueble cuando se va a vender (tanteo) o una vez vendido (retracto). Algunas administraciones, como la Generalitat Valenciana, lo han usado para comprar edificios enteros y pueden cederlo a los ayuntamientos.\n\nSi un edificio os interesa, compites con una administración que paga con fondos públicos."},
sareb:{t:"Sareb y Casa 47",d:"La Sareb es el llamado «banco malo», creado en 2012 con activos de bancos rescatados. Según la prensa, se prevé su liquidación en 2027 y sus viviendas y suelos pasan a la empresa pública Sepes, rebautizada Casa 47.\n\nComprueba el estado actual en fuentes oficiales: la situación cambia rápido."},
iee:{t:"Informe de evaluación del edificio",d:"La «ITV» de los edificios. Es obligatorio para las fincas de más de 50 años y recoge su estado de conservación, accesibilidad y eficiencia. Pídelo antes de comprar un edificio antiguo."},
suelofin:{t:"Suelo finalista",d:"Suelo que ya tiene toda la tramitación urbanística aprobada y se puede construir. Comprar suelo que no lo es puede alargar el proyecto durante años."},
nota:{t:"Nota simple",d:"Informe del Registro de la Propiedad que dice quién es el titular de un inmueble y qué cargas tiene. Es el primer documento que hay que pedir de cualquier candidato."},
cargas:{t:"Cargas",d:"Deudas o limitaciones que pesan sobre un inmueble: hipotecas, embargos, arrendamientos u otros derechos de terceros. Aparecen en la nota simple."},
ley32023:{t:"Ley 3/2023 de Viviendas Colaborativas",d:"Ley de la Comunitat Valenciana (ejemplo de normativa autonómica: mira si tu comunidad tiene la suya) que define y regula las viviendas colaborativas, el régimen de la entidad titular, el de las personas usuarias y medidas de fomento.\n\nLéela con vuestra asesoría jurídica antes de redactar los estatutos.",link:["Texto de la ley (PDF)","https://www.elnotario.es/images/pdf/LAUT-N109-14.pdf"]},
evha:{t:"EVha",d:"Entitat Valenciana d'Habitatge i Sòl, entidad pública de la Generalitat Valenciana (ejemplo autonómico). Lanzó un concurso de derecho de superficie sobre siete parcelas para cooperativas en cesión de uso, en Gandia, Alzira, Torrent, Alicante, Alcoi, Sant Joan y Torrevieja. Ninguna en València ciudad.",rel:["superficie"]},
fecovi:{t:"Fecovi",d:"Federación de Cooperativas de Viviendas y Rehabilitación de la Comunitat Valenciana, ejemplo de federación autonómica. Cada comunidad suele tener la suya: busca la de tu zona. Organizan jornadas sobre cesión de uso y asesoran a grupos nuevos.",link:["fecovi.es","https://www.fecovi.es"]},
redbase:{t:"Red Base Viva",d:"Iniciativa valenciana de las consellerias de Economía Sostenible y de Vivienda junto a Fecovi para fomentar proyectos de colaboración público-cooperativa. Un ayuntamiento de Castellón la citó al reunirse con colectivos interesados en cooperativas en cesión de uso."}
};

export const PH:Phase[]=[
{id:"grupo",short:"Grupo",title:"Reunir el grupo motor",lead:"Un núcleo de personas que comparten la necesidad de vivienda y la visión del proyecto. Suele nacer de amistades, de un barrio o de un movimiento vecinal.",terms:["grupo","asamblea"],ents:[],tasks:[
 {id:"g1",t:"Escribir en una página qué buscáis: dónde, para quién y con qué valores"},
 {id:"g2",t:"Reunir un primer núcleo de familias comprometidas: el {{grupo|grupo motor}}"},
 {id:"g3",t:"Acordar cómo decidís y cada cuánto os reunís: la {{asamblea|asamblea}} empieza desde el primer día"},
 {id:"g4",t:"Recoger, de forma privada, los ingresos aproximados de cada familia: afectan a los requisitos de {{vpo|vivienda protegida}}",go:"calc",goL:"Comprobar"},
 {id:"g5",t:"Hablar de cuánto puede aportar cada familia al entrar",go:"calc",goL:"Simular"}]},
{id:"red",short:"Red",title:"Buscar asesoría y apoyo",lead:"No hace falta reinventar nada. Hay federaciones y cooperativas con estatutos modelo, asesoría jurídica y financiera, y experiencia acumulada.",terms:["fecovi","redbase","banca"],ents:["fed","sostre","fiare"],tasks:[
 {id:"r1",t:"Contactar con la federación de cooperativas de tu comunidad (en la Comunitat Valenciana, {{fecovi|Fecovi}}) y pedir una sesión informativa",go:"entidades",goL:"Mensaje"},
 {id:"r2",t:"Hablar con una cooperativa que ya funcione, como La Borda en Barcelona o Entrepatios en Madrid"},
 {id:"r3",t:"Preguntar por redes de colaboración público-cooperativa (en la Comunitat Valenciana, la {{redbase|Red Base Viva}}) y por convocatorias abiertas del gobierno autonómico y del Ayuntamiento"},
 {id:"r4",t:"Elegir equipo técnico (arquitectura y gestión) con experiencia en cesión de uso"},
 {id:"r5",t:"Tener una primera conversación con una entidad de {{banca|banca ética}}",go:"entidades",goL:"Mensaje"}]},
{id:"cons",short:"Estatutos",title:"Constituir la cooperativa",lead:"Aquí se fijan las reglas: cuotas, derechos, cómo se transmite el uso y qué se devuelve a quien se va. Hazlo con apoyo jurídico.",terms:["estatutos","cesion","ley32023"],ents:["fed"],tasks:[
 {id:"c1",t:"Redactar los {{estatutos|estatutos}} con asesoría jurídica, marcando la {{cesion|cesión de uso}}"},
 {id:"c2",t:"Definir la {{aportacion|aportación inicial}} y las condiciones de salida y devolución"},
 {id:"c3",t:"Decidir cómo se admiten nuevos socios y cómo se transmite o hereda el derecho de uso"},
 {id:"c4",t:"Constituir legalmente la cooperativa y registrarla; consulta también la {{ley32023|Ley 3/2023}}"},
 {id:"c5",t:"Comprobar que los estatutos son de verdad de cesión de uso: hay «cooperativas» que solo son una forma jurídica de promoción"}]},
{id:"suelo",short:"Suelo",title:"Encontrar suelo o edificio",lead:"Suele ser el cuello de botella. Hay cinco vías y la pestaña Oportunidades las compara. Cuanto antes tengáis varios candidatos, mejor.",hard:"Normalmente la parte más difícil",terms:["superficie","evha","sareb","tanteo","iee"],ents:["ayto","reg","portal_ed","portal_te"],tasks:[
 {id:"s1",t:"Preguntar al Ayuntamiento y al organismo autonómico de vivienda (en la Comunitat Valenciana, la {{evha|EVha}}) si hay concurso de suelo para cooperativas",go:"entidades",goL:"Mensaje"},
 {id:"s2",t:"Apuntar al menos tres candidatos en la lista de oportunidades",go:"candidatos",goL:"Añadir"},
 {id:"s3",t:"Revisar cada candidato con la lista de comprobaciones: estructura, {{iee|informe del edificio}}, licencia, {{cargas|cargas}} y quién vende",go:"candidatos",goL:"Revisar"},
 {id:"s4",t:"Simular el coste de cada candidato en la calculadora",go:"calc",goL:"Simular"},
 {id:"s5",t:"Elegir en asamblea el candidato y hacer la oferta o presentar el proyecto al concurso"}]},
{id:"fin",short:"Dinero",title:"Cerrar la financiación",lead:"Se combinan las aportaciones de las personas socias, un préstamo y, si las hay, ayudas públicas. El préstamo suele venir de banca ética.",hard:"Normalmente la parte más difícil",terms:["banca","aportacion","cuota","iprem"],ents:["fiare","coop57","triodos"],tasks:[
 {id:"f1",t:"Fijar el coste total estimado: suelo o edificio, obra, honorarios e impuestos",go:"calc",goL:"Calcular"},
 {id:"f2",t:"Pedir oferta de préstamo al menos a dos entidades de {{banca|banca ética}}",go:"entidades",goL:"Mensaje"},
 {id:"f3",t:"Comprobar qué ayudas hay activas ahora; en 2024 las de rehabilitación estaban congeladas y conviene verificar si se han reactivado"},
 {id:"f4",t:"Calcular la {{cuota|cuota mensual}} y comprobar que cabe en el 30% de los ingresos de cada familia",go:"calc",goL:"Comprobar"},
 {id:"f5",t:"Aprobar el plan económico en asamblea"}]},
{id:"obra",short:"Obra",title:"Proyecto, obra y vida en común",lead:"Se diseña con la participación de las familias, se construye o rehabilita y empieza la vida cotidiana de la cooperativa.",terms:["fondo","asamblea"],ents:[],tasks:[
 {id:"o1",t:"Contratar la arquitectura y diseñar viviendas y espacios comunes con participación de las familias"},
 {id:"o2",t:"Tramitar licencias y licitar la obra o la rehabilitación"},
 {id:"o3",t:"Seguir la obra y el presupuesto en asamblea"},
 {id:"o4",t:"Dotar el {{fondo|fondo de reserva}} y crear comisiones: mantenimiento, cuidados, comunicación"},
 {id:"o5",t:"Hacer la mudanza y celebrar la primera asamblea de vida en común"}]}
];

export const VIAS:Via[]=[
{id:"concurso",title:"Concurso de suelo público",tag:"Derecho de superficie",s:{c:4,r:2,z:3,l:2},
 que:"La administración cede suelo a cooperativas sin ánimo de lucro por un precio simbólico o inferior al de mercado, mediante {{superficie|derecho de superficie}}. La cooperativa construye y gestiona; al acabar el plazo (hasta 75 años en un concurso de la {{evha|EVha}}) el suelo vuelve a ser público.",
 pro:["Evitas pagar suelo de mercado","La administración ya reconoce el modelo"],
 con:["Requisitos de renta y colectivos preferentes","Depende de que se abra una convocatoria","Comprueba si hay alguno abierto en tu ciudad: no siempre los hay (en València ciudad no se vio ninguno en el concurso de la EVha)"],
 ver:"Pregunta al Ayuntamiento por su inventario de solares municipales y al organismo autonómico de vivienda por nuevas convocatorias.",
 link:[{url:"https://fecovi.es/plan-base-viva-colaboracion-publico-cooperativa-vivienda/",label:"Plan Base Viva (FECOVI)",nota:"Esto no es una convocatoria abierta ni una vía garantizada. FECOVI, la federación valenciana de cooperativas de vivienda, busca ayuntamientos dispuestos a ceder suelo (ha hablado con más de 30, entre ellos València, Sagunto y Alcublas). Puedes escribirles a fecovi@fecovi.es o llamar al 963 74 32 27 / 722 177 830 para preguntar qué ayuntamientos tienen suelo en marcha. Atienden en C/ de los Caballeros 26 (València) solo con cita previa. Atienden mejor a grupos ya constituidos o en formación que a personas sueltas."}]},
{id:"edificio",title:"Edificio existente a rehabilitar",tag:"Compra",s:{c:2,r:3,z:3,l:4},
 que:"La cooperativa compra una finca, o la recibe cedida, y la rehabilita. En Olesa de Montserrat un edificio abandonado de una promoción fallida se convirtió en 25 viviendas cooperativas.",
 pro:["Menos riesgo urbanístico que el suelo vacío","Podéis decidir el proyecto y quién entra"],
 con:["Pagas precio de mercado","Rehabilitar cuesta y exige un {{iee|informe técnico}}","Las ayudas a la rehabilitación estuvieron congeladas en 2024: verifica su estado"],
 ver:"Pide la {{nota|nota simple}}, el informe del edificio y un presupuesto de rehabilitación antes de ofertar."},
{id:"parada",title:"Promoción parada",tag:"Sareb · Casa 47 · servicers",s:{c:3,r:2,z:2,l:3},
 que:"Edificios a medio construir que heredaron bancos y la {{sareb|Sareb}}. Como ejemplo, hubo una campaña con 23 obras paradas en la Comunitat Valenciana. La cartera se está traspasando, así que pregunta por lo que hay hoy.",
 pro:["Parte de la estructura ya existe"],
 con:["Hay que revisar a fondo la obra hecha y la licencia","Las grandes propietarias son lentas","Un concurso de suelo para alquiler asequible de la Sareb quedó desierto en Alicante (ejemplo): puede indicar dificultad o margen para negociar"],
 ver:"Pregunta a los servicers y a Casa 47 qué promociones inacabadas tienen en tu ciudad y si venden a cooperativas.",
 link:[{url:"https://www.sareb.es/inmuebles/comunitat-valenciana/",label:"Buscador de inmuebles de Sareb",nota:"Una vez dentro, aplica tú el filtro de Valencia y busca en «Suelos» y «Obra en curso»: el filtro no se puede pasar por el enlace. Casa 47 no tiene listados de inmuebles ni suelo para cooperativas. Como Sareb está traspasando su cartera a Casa 47, cada vez habrá menos en su buscador."}]},
{id:"tanteo",title:"Edificio que la administración rechaza",tag:"Idea sin contrastar",s:{c:2,r:3,z:1,l:4},
 que:"Cuando alguien vende un edificio, la administración puede ejercer {{tanteo|tanteo y retracto}}. Como ejemplo, una moción del Ayuntamiento de València de 2025 recoge que descartó algunos edificios ofrecidos, como San Jacinto 22. Podrían interesar a una cooperativa. Es una idea de este asistente y no está contrastada.",
 pro:["Edificios completos ya identificados"],
 con:["Si la administración los rechazó, quizá fue por estado o precio","Si cambia de criterio, compite con fondos públicos"],
 ver:"Pregunta al Ayuntamiento si hay ofertas de edificios que no piense ejercer."},
{id:"privado",title:"Suelo privado",tag:"Compra",s:{c:1,r:1,z:2,l:5},
 que:"Compráis suelo entre todas las personas socias. Es la vía con más libertad, la más cara y la más lenta. Comprar suelo que no sea {{suelofin|finalista}} puede alargar el proyecto durante años.",
 pro:["Decidís el proyecto y quién entra","Sin requisitos de renta de vivienda protegida"],
 con:["Suelo a precio de mercado","La banca convencional conoce poco el modelo","Riesgo urbanístico"],
 ver:"Asegúrate de que el suelo es finalista y de que la financiación ética cubre el importe."}
];
export const CRIT:[keyof Scores,string][]=[["c","Coste bajo"],["r","Rapidez"],["z","Certeza"],["l","Libertad del grupo"]];
export const ES=["Detectado","Contactado","Visita","Análisis técnico","Oferta","Descartado"];
export const ES_MIX=[16,32,50,70,92,0];
export const CHK=[
 "Nota simple: titular real y cargas",
 "Estado estructural revisado por una persona técnica",
 "Informe de evaluación del edificio, si tiene más de 50 años",
 "Licencia y calificación urbanística; si es suelo, que sea finalista",
 "Quién vende de verdad: banco, servicer, fondo o particular",
 "Precio compatible con una cuota que quepa en el 30% de los ingresos",
 "Plazos y condiciones de venta, y si aceptan cooperativas"
];

export const REGIONS:[string,string][]=[["an","Andalucía"],["ar","Aragón"],["as","Asturias"],["ib","Illes Balears"],["cn","Canarias"],["cb","Cantabria"],["cl","Castilla y León"],["cm","Castilla-La Mancha"],["ct","Cataluña"],["cv","Comunitat Valenciana"],["ex","Extremadura"],["ga","Galicia"],["md","Comunidad de Madrid"],["mc","Región de Murcia"],["na","Navarra"],["pv","País Vasco"],["ri","La Rioja"],["ce","Ceuta"],["ml","Melilla"]];
export const regionName=(id:string)=>REGIONS.find(r=>r[0]===id)?.[1]||"";
const gs=(q:string)=>"https://www.google.com/search?q="+encodeURIComponent(q);
const nrm=(x:string)=>x.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim();
export const isValenciaCity=(g:Group)=>["valencia","valència"].includes(nrm(g.ciudad||""));

/** Entidades según la ubicación del grupo. Donde no hay datos propios, enlaces de búsqueda y recursos estatales. */
export function entitiesFor(g:Group):Entity[]{
 const reg=regionName(g.region), city=(g.ciudad||"").trim(), cv=g.region==="cv", vlc=isValenciaCity(g);
 const rN=reg||"tu comunidad", cN=city||"tu ciudad";
 const out:Entity[]=[];
 out.push(cv?{g:"Red y asesoría",id:"fed",name:"Fecovi",desc:"Federación valenciana de cooperativas de viviendas. Punto de partida para asesoría, jornadas y contactos con otras cooperativas.",url:"https://www.fecovi.es",ul:"Abrir fecovi.es",ct:["fecovi@fecovi.es","963 743 227"],ctn:"Contacto publicado en un documento de 2022; comprueba que sigue vigente.",tpl:"fed"}
  :{g:"Red y asesoría",id:"fed",name:"Federación de cooperativas de viviendas · "+rN,desc:"Casi todas las comunidades tienen una federación o asociación de cooperativas de vivienda (en la Comunitat Valenciana, Fecovi). Búscala: te asesora, tiene estatutos modelo y conoce otros grupos.",url:gs("federación cooperativas de viviendas "+(reg||"España")),ul:"Buscar en la web",tpl:"fed"});
 out.push({g:"Red y asesoría",id:"sostre",name:"Sostre Cívic",desc:"Cooperativa catalana pionera en cesión de uso. Tiene guías y experiencia que sirven de referencia en toda España.",url:"https://sostrecivic.coop",ul:"Abrir sostrecivic.coop"});
 out.push(vlc?{g:"Administración",id:"ayto",name:"Ayuntamiento de València · Vivienda",desc:"Prepara un mapa de solares municipales residenciales. Pregunta si habrá concurso para cooperativas.",url:"https://www.valencia.es",ul:"Abrir valencia.es",tpl:"ayto"}
  :{g:"Administración",id:"ayto",name:"Ayuntamiento de "+cN+" · Vivienda",desc:"Pregunta por su patrimonio municipal de suelo, solares disponibles y si prevé concursos de cesión para cooperativas.",url:gs("ayuntamiento "+cN+" vivienda suelo municipal cooperativas cesión de uso"),ul:"Buscar en la web",tpl:"ayto"});
 out.push(cv?{g:"Administración",id:"reg",name:"Generalitat · Vivienda y EVha",desc:"La EVha ha sacado concursos de derecho de superficie para cooperativas. Pregunta por los próximos.",url:"https://www.gva.es",ul:"Abrir gva.es",tpl:"reg"}
  :{g:"Administración",id:"reg",name:"Gobierno de "+rN+" · Vivienda",desc:"La consejería o departamento de vivienda autonómico gestiona suelo público, ayudas y normativa propia sobre vivienda colaborativa o cooperativa.",url:gs("consejería vivienda "+(reg||"comunidad autónoma")+" cooperativas cesión de uso derecho de superficie"),ul:"Buscar en la web",tpl:"reg"});
 out.push({g:"Propietarios y portales",id:"sareb",name:"Casa 47 (antes Sepes) y Sareb",desc:"Heredan promociones inacabadas y suelos en toda España. Según la prensa, la Sareb se liquida en 2027.",url:gs("Casa 47 Sepes viviendas suelos Sareb "+cN+" promociones"),ul:"Buscar en la web",tpl:"servicer"});
 out.push(vlc?{g:"Propietarios y portales",id:"portal_ed",name:"Fotocasa · edificios en venta",desc:"Edificios completos en València.",url:"https://www.fotocasa.es/es/comprar/edificios/valencia-capital/todas-las-zonas/l",ul:"Edificios en venta"}
  :{g:"Propietarios y portales",id:"portal_ed",name:"Edificios en venta en "+cN,desc:"Búsqueda en portales inmobiliarios. Revisa siempre el anuncio original.",url:gs("edificios completos en venta "+cN+" idealista fotocasa"),ul:"Buscar en la web"});
 out.push(vlc?{g:"Propietarios y portales",id:"portal_te",name:"Fotocasa · terrenos en venta",desc:"Solares y terrenos en València. Comprueba siempre si el suelo es finalista.",url:"https://www.fotocasa.es/es/comprar/terrenos/valencia-capital/todas-las-zonas/l",ul:"Terrenos en venta"}
  :{g:"Propietarios y portales",id:"portal_te",name:"Terrenos y solares en venta en "+cN,desc:"Comprueba siempre si el suelo es finalista.",url:gs("solares terrenos urbanos en venta "+cN+" idealista fotocasa"),ul:"Buscar en la web"});
 out.push({g:"Financiación",id:"fiare",name:"Fiare Banca Ética",desc:"Banca ética que financia vivienda cooperativa en cesión de uso. Opera en toda España.",url:"https://www.fiarebancaetica.coop",ul:"Abrir fiarebancaetica.coop",tpl:"banca"});
 out.push({g:"Financiación",id:"coop57",name:"Coop57",desc:"Cooperativa de servicios financieros éticos y solidarios.",url:"https://www.coop57.coop",ul:"Abrir coop57.coop",tpl:"banca"});
 out.push({g:"Financiación",id:"triodos",name:"Triodos Bank",desc:"Banco con criterios sociales y ambientales que ha financiado proyectos de vivienda cooperativa.",url:"https://www.triodos.es",ul:"Abrir triodos.es",tpl:"banca"});
 return out;
}

export function tplText(k:string,g:Group):string{
 const n=g.name.trim()||"[nombre del grupo]", f=g.fam||"[nº]", b=g.barrio.trim(), c=(g.ciudad||"").trim()||"[ciudad]", reg=regionName(g.region)||"[comunidad]", cv=g.region==="cv";
 const zona=b?" Nos interesa especialmente la zona de "+b+".":"";
 const pie="\n\nPodéis escribirnos a [tu correo] o llamarnos al [tu teléfono].\n\nUn saludo,\n[tu nombre], en nombre de "+n;
 const intro="Somos "+n+", un grupo de "+f+" familias de "+c+" que queremos constituir una cooperativa de vivienda en régimen de cesión de uso.";
 const T:Record<string,[string,string]>={
 fed:["Asunto: Grupo de familias de "+c+" interesado en vivienda cooperativa en cesión de uso","Hola:\n\n"+intro+" Partimos de cero."+zona+"\n\nOs queremos preguntar:\n1. Si organizáis sesiones informativas o acompañamiento para grupos nuevos.\n2. Qué convocatorias de suelo o edificios para cooperativas hay abiertas o previstas ("+reg+" y ayuntamientos).\n3. Qué cooperativas en cesión de uso de la zona podemos visitar.\n4. Qué asesoría jurídica y financiera ofrecéis para redactar estatutos y buscar financiación."+pie],
 ayto:["Asunto: Consulta sobre suelo municipal para cooperativas de vivienda en cesión de uso","Buenos días:\n\n"+intro+zona+"\n\nQuerríamos saber:\n1. Si hay un inventario de parcelas y solares municipales residenciales y dónde consultarlo.\n2. Si se prevé un concurso de cesión de suelo dirigido a cooperativas y, en ese caso, sus plazos y requisitos.\n3. Si hay edificios ofrecidos por tanteo y retracto que el Ayuntamiento no vaya a ejercer y que una cooperativa pudiera estudiar."+pie],
 reg:["Asunto: Próximos concursos de suelo o derecho de superficie para cooperativas","Buenos días:\n\n"+intro+zona+"\n\n"+(cv?"Hemos visto el concurso de la EVha para siete parcelas, ninguna en la ciudad de València. Querríamos saber si hay nuevos concursos previstos para cooperativas en nuestra zona, y cuáles serían los requisitos y plazos.":"Querríamos saber si "+reg+" tiene o prevé programas, concursos de suelo público o derecho de superficie para cooperativas en cesión de uso, qué normativa autonómica nos afecta y qué requisitos y plazos tendrían.")+pie],
 servicer:["Asunto: Promociones inacabadas o edificios en venta en "+c,"Buenos días:\n\n"+intro+zona+"\n\nQuerríamos conocer qué edificios, promociones inacabadas o suelos tenéis en "+c+" y:\n1. Su situación registral, urbanística y de licencia.\n2. Precio y condiciones de venta.\n3. Si podéis vender a una cooperativa y en qué plazos."+pie],
 banca:["Asunto: Información sobre financiación para una cooperativa de vivienda en cesión de uso","Buenos días:\n\n"+intro+zona+"\n\nQuerríamos saber:\n1. Qué requisitos pedís a una cooperativa de este tipo.\n2. Qué importe máximo, plazo y tipo de interés manejáis de forma orientativa.\n3. Qué garantías y qué aportación mínima de las personas socias esperáis.\n4. Qué documentación conviene llevar a una primera reunión."+pie]
 };
 const x=T[k]; return x?x[0]+"\n\n"+x[1]:"";
}

export const SRC:[string,string][]=[
["Ley 3/2023 de Viviendas Colaborativas (PDF)","https://www.elnotario.es/images/pdf/LAUT-N109-14.pdf"],
["Valencia Plaza: mapa de solares municipales","https://valenciaplaza.com/valenciaplaza/valencia-elabora-un-mapa-de-solares-municipales-para-posibilitar-mas-viviendas-de-alquiler-asequible"],
["Valencia Plaza: Plan + Vivienda del Ayuntamiento","https://valenciaplaza.com/valenciaplaza/permutas-cesion-de-suelos-compra-directavalencia-activa"],
["Valencia Plaza: concurso de la EVha para cooperativas","https://valenciaplaza.com/valenciaplaza/el-consell-da-mas-plazo-a-las-cooperativas-para-optar-a-construir-vpo-en-siete-parcelas-publicas"],
["Valencia Plaza: cooperativas de viviendas en la Comunitat","https://valenciaplaza.com/valenciaplaza/cooperativas-de-viviendas-situacion-comunitat-valenciana"],
["La Marea: contra la especulación, vivienda cooperativa","https://www.lamarea.com/2025/04/08/contra-especulacion-vivienda-cooperativa"],
["elDiario.es: ni comprar ni alquilar, usar y compartir","https://www.eldiario.es/alternativaseconomicas/comprar-alquilar-vivienda-usar-compartir_132_1842920.html"],
["elDiario.es: la vivienda cooperativa y los impuestos","https://www.eldiario.es/economia/vivienda-cooperativa-reclama-mejoras-fiscales-denuncia-absurdo-pagar-impuestos-socimis_1_13291357.amp.html"],
["Valencia Plaza: 23 obras paradas de la Sareb","https://valenciaplaza.com/valenciaplaza/Elbancomaloponeenventa23edificiosamitadconstruirenlaComunitat"],
["Alicante Plaza: el concurso de la Sareb queda desierto","https://alicanteplaza.es/alicanteplaza/plaza-inmobiliaria-alicante/elconcursodelasarebparaalquilerasequiblesequedadesiertodossuelosenalicantesinofertas"],
["Ayuntamiento de València: moción sobre tanteo y retracto (2025)","https://www.valencia.es/documents/d/guest/i-urb-mayo2025-3"],
["Valencia Plaza: ayudas a la rehabilitación congeladas en 2024","https://valenciaplaza.com/valenciaplaza/lageneralitatcongelalasayudasalarehabilitaciondeedificiosyviviendas1"],
["Sostre Cívic: guía de vivienda cooperativa en cesión de uso (PDF)","https://sostrecivic.coop/biblio/biblio_383.pdf"]
];
