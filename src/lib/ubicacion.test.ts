import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { MUNICIPIOS, normalizar, resolverCentro, distanciaKm, ubicar, distanciaAnuncio, consultaMapa } from "./ubicacion";
import { parseFotocasa } from "./parse-fotocasa";
import { parsePisos } from "./parse-pisos";
import { parseYaencontre } from "./parse-yaencontre";

const anuncio = (url: string, zona = "València", titulo = "Edificio", resumen = "") => ({ url, zona, titulo, resumen });
const nombre = (l: ReturnType<typeof anuncio>) => ubicar(l)?.municipio.nombre ?? null;

describe("tabla de municipios", () => {
  it("tiene los 542 municipios de la Comunitat Valenciana, 266 de la provincia de València", () => {
    expect(MUNICIPIOS).toHaveLength(542);
    expect(MUNICIPIOS.filter((m) => m.provincia === "València")).toHaveLength(266);
    expect(MUNICIPIOS.filter((m) => m.provincia === "Castelló")).toHaveLength(135);
    expect(MUNICIPIOS.filter((m) => m.provincia === "Alacant")).toHaveLength(141);
  });
  it("todos tienen nombre y coordenadas dentro de la Comunitat Valenciana", () => {
    for (const m of MUNICIPIOS) {
      expect(m.nombre.length, m.ine).toBeGreaterThan(1);
      expect(m.lat, m.ine).toBeGreaterThan(37.8); expect(m.lat, m.ine).toBeLessThan(40.8);
      expect(m.lon, m.ine).toBeGreaterThan(-1.6); expect(m.lon, m.ine).toBeLessThan(0.8);
    }
  });
  it("los códigos INE son únicos", () => expect(new Set(MUNICIPIOS.map((m) => m.ine)).size).toBe(542));
});

describe("normalizar", () => {
  it("quita tildes, signos y apóstrofos", () => {
    expect(normalizar("l'Alcúdia")).toBe("l alcudia");
    expect(normalizar("  Avinguda Nou d'Octubre-Port de Sagunt ")).toBe("avinguda nou d octubre port de sagunt");
  });
});

describe("resolverCentro", () => {
  it("entiende el nombre en castellano, en valenciano y con variantes", () => {
    for (const t of ["València", "Valencia", "valencia", "VALÈNCIA", "Valencia capital"]) expect(resolverCentro(t)?.ine, t).toBe("46250");
    expect(resolverCentro("Torrent")?.nombre).toBe("Torrent");
    expect(resolverCentro("Torrente")?.nombre).toBe("Torrent");
    expect(resolverCentro("Gandía")?.nombre).toBe("Gandia");
    expect(resolverCentro("Elche")?.nombre).toBe("Elx");
    expect(resolverCentro("Manises")?.nombre).toBe("Manises");
    expect(resolverCentro("l'Alcúdia")?.ine).toBe("46019");
  });
  it("un barrio de València da València", () => expect(resolverCentro("Russafa")?.ine).toBe("46250"));
  it("devuelve null con lo que no reconoce", () => {
    expect(resolverCentro("")).toBeNull();
    expect(resolverCentro("Narnia")).toBeNull();
  });
});

describe("distanciaKm", () => {
  const v = resolverCentro("València")!;
  it("València–Torrent, València–Sagunt y València–Gandia son del orden esperado", () => {
    expect(distanciaKm(v, resolverCentro("Torrent")!)).toBeGreaterThan(6);
    expect(distanciaKm(v, resolverCentro("Torrent")!)).toBeLessThan(10);
    expect(distanciaKm(v, resolverCentro("Sagunt")!)).toBeGreaterThan(22);
    expect(distanciaKm(v, resolverCentro("Sagunt")!)).toBeLessThan(28);
    expect(distanciaKm(v, resolverCentro("Gandia")!)).toBeGreaterThan(55);
    expect(distanciaKm(v, resolverCentro("Gandia")!)).toBeLessThan(62);
  });
  it("de un sitio a sí mismo es 0", () => expect(distanciaKm(v, v)).toBe(0));
});

describe("ubicar anuncios reales de la provincia de València", () => {
  it("Fotocasa: el municipio sale de la dirección, no del campo zona", () => {
    expect(nombre(anuncio("https://www.fotocasa.es/es/comprar/edificio/burjassot/zona-campus-universitario/188666927/d"))).toBe("Burjassot");
    expect(nombre(anuncio("https://www.fotocasa.es/es/comprar/edificio/valencia-capital/trinitat/188833958/d", "Trinitat"))).toBe("València");
    expect(nombre(anuncio("https://www.fotocasa.es/es/comprar/edificio/llutxent/llutxent/189219216/d"))).toBe("Llutxent");
    expect(nombre(anuncio("https://www.fotocasa.es/es/comprar/edificio/l-olleria/l-olleria/150304554/d"))).toBe("l'Olleria");
    expect(nombre(anuncio("https://www.fotocasa.es/es/comprar/edificio/ontinyent/centro/190617410/d"))).toBe("Ontinyent");
    expect(nombre(anuncio("https://www.fotocasa.es/es/comprar/edificio/alcublas/zona-comunitaria/185494978/d"))).toBe("les Alcubles");
  });
  it("Pisos.com: el municipio sale del nombre de la zona dentro del enlace", () => {
    expect(nombre(anuncio("https://www.pisos.com/comprar/edificio-avinguda_nou_octubre_port_de_sagunt46520-59237602783_100500/", "Avinguda Nou d'Octubre-Port de Sagunt"))).toBe("Sagunt");
    expect(nombre(anuncio("https://www.pisos.com/comprar/edificio-naquera_naquera_centro_urbano-65834152967_529951/"))).toBe("Nàquera");
    expect(nombre(anuncio("https://www.pisos.com/comprar/edificio-serra_centro_urbano-60875803092_100500/"))).toBe("Serra");
    expect(nombre(anuncio("https://www.pisos.com/comprar/edificio-gandia_ciutat_centre_historic46701-55036165347_106600/", "Centre Històric"))).toBe("Gandia");
    expect(nombre(anuncio("https://www.pisos.com/comprar/edificio-segart_centro_urbano-56728748197_106600/"))).toBe("Segart");
  });
  it("yaencontre: el municipio sale de la zona", () => {
    const u = "https://www.yaencontre.com/venta/edificio/inmueble-76674-112781484";
    expect(nombre(anuncio(u, "Alzira"))).toBe("Alzira");
    expect(nombre(anuncio(u, "Oliva"))).toBe("Oliva");
    expect(nombre(anuncio(u, "Pobla del Duc (la)"))).toBe("la Pobla del Duc");
  });
  it("un barrio de València da València", () => {
    const u = "https://www.yaencontre.com/venta/edificio/inmueble-1-2";
    expect(nombre(anuncio(u, "El Cabanyal- El Canyamelar"))).toBe("València");
    expect(nombre(anuncio(u, "La Xerea"))).toBe("València");
    expect(nombre(anuncio("https://www.pisos.com/comprar/edificio-benimamet-1_2/", "Benimàmet"))).toBe("València");
  });
  it("distritos de València y barrios de Gandia que traen los portales", () => {
    expect(nombre(anuncio("https://www.pisos.com/comprar/edificio-pobles_de_oest-65001997998_106700/", "Pobles de l'Oest"))).toBe("València");
    expect(nombre(anuncio("https://www.pisos.com/comprar/edificio-pobles_del_sud-58392454296_106700/", "Pobles del Sud"))).toBe("València");
    expect(nombre(anuncio("https://www.pisos.com/comprar/edificio-benipeixcar_raval-48428079956_100500/", "Benipeixcar-Raval"))).toBe("Gandia");
  });
  it("lo ambiguo se queda sin ubicar en vez de adivinar", () => {
    expect(nombre(anuncio("https://www.pisos.com/comprar/edificio-zona_aeroport-66734808919_106400/", "Zona Aeroport", "Edificio en calle de la Aviación"))).toBeNull();
  });
  it("sin dirección ni zona útil, usa «en Municipio» del título; y no se deja engañar por palabras corrientes", () => {
    const u = "https://www.yaencontre.com/venta/edificio/inmueble-1-2";
    expect(ubicar(anuncio(u, "València", "Edificio residencial en Oliva"))?.origen).toBe("texto");
    expect(nombre(anuncio(u, "València", "Edificio residencial en Oliva"))).toBe("Oliva");
    expect(nombre(anuncio(u, "València", "Real estate opportunity in the city", "Un edificio real"))).toBeNull();
  });
  it("el «València» por defecto de los portales no cuenta como ubicación", () => {
    expect(ubicar(anuncio("https://www.yaencontre.com/venta/edificio/inmueble-1-2", "València"))).toBeNull();
  });
  it("las direcciones raras no rompen nada", () => {
    expect(ubicar(anuncio("no es una url", "Alzira"))?.municipio.nombre).toBe("Alzira");
  });
});

describe("ubicar con los anuncios guardados como ejemplo", () => {
  const leer = (f: string) => readFileSync(__dirname + "/__fixtures__/" + f, "utf8");
  const todos = [...parseFotocasa(leer("fotocasa-edificios.md")), ...parsePisos(leer("pisos-edificios.md")), ...parseYaencontre(leer("yaencontre-edificios.md"))];
  it("ubica la inmensa mayoría y todos dentro de la Comunitat Valenciana", () => {
    const ubicados = todos.filter((l) => ubicar(l));
    expect(todos.length).toBeGreaterThan(8);
    expect(ubicados.length / todos.length).toBeGreaterThanOrEqual(0.75);
  });
  it("la distancia al centro se calcula solo para lo ubicado", () => {
    const v = resolverCentro("València")!;
    for (const l of todos) {
      const d = distanciaAnuncio(l, v);
      if (ubicar(l)) expect(d).toBeGreaterThanOrEqual(0); else expect(d).toBeNull();
    }
  });
});

describe("consultaMapa", () => {
  const q = (a: ReturnType<typeof anuncio>) => consultaMapa(a);
  it("Fotocasa con zona por defecto: usa el municipio de la dirección, no «València València»", () => {
    expect(q(anuncio("https://www.fotocasa.es/es/comprar/edificio/burjassot/zona-campus-universitario/188666927/d"))).toBe("Burjassot, València, España");
    expect(q(anuncio("https://www.fotocasa.es/es/comprar/edificio/llutxent/llutxent/189219216/d"))).toBe("Llutxent, València, España");
  });
  it("Fotocasa con barrio: lo añade al municipio sin repetir València", () => {
    expect(q(anuncio("https://www.fotocasa.es/es/comprar/edificio/valencia-capital/trinitat/188833958/d", "Trinitat"))).toBe("Trinitat, València, España");
  });
  it("usa el lugar del título y limpia lo que no ayuda", () => {
    expect(q(anuncio("https://www.yaencontre.com/venta/terreno/inmueble-1-2", "Llíria", "Terreno en Parque de la Bombilla-Pla de Rascanya, Llíria"))).toBe("Parque de la Bombilla, Pla de Rascanya, Llíria, València, España");
    expect(q(anuncio("https://www.pisos.com/comprar/edificio-gandia_ciutat_centre_historic46701-55036165347_106600/", "Centre Històric", "Edificio en Carrer del Duc Carles de Borja"))).toBe("Carrer del Duc Carles de Borja, Centre Històric, Gandia, València, España");
    expect(q(anuncio("https://www.pisos.com/comprar/edificio-gandia_x-1_2/", "València", "Edificio en calle Mayor No Number"))).toBe("calle Mayor, Gandia, València, España");
  });
  it("ignora lo que se añade al título al apuntarlo como candidato («· 731 m²»)", () => {
    expect(q(anuncio("https://www.yaencontre.com/venta/terreno/inmueble-1-2", "Llíria", "Terreno en Parque de la Bombilla-Pla de Rascanya, Llíria · 731 m²"))).toBe("Parque de la Bombilla, Pla de Rascanya, Llíria, València, España");
    expect(q(anuncio("https://www.fotocasa.es/es/comprar/edificio/torrent/zona/1/d", "Zona Centro", "Edificio de pisos · Zona Centro · 480 m²"))).toBe("Zona Centro, Torrent, València, España");
  });
  it("no repite el municipio si el título ya lo dice, ni con otro nombre", () => {
    expect(q(anuncio("https://www.yaencontre.com/venta/edificio/inmueble-1-2", "Alzira", "Edificio en Ayuntamiento - Centro, Alzira"))).toBe("Ayuntamiento, Centro, Alzira, València, España");
    expect(q(anuncio("https://www.yaencontre.com/venta/edificio/inmueble-1-2", "Torrent", "Edificio en Casco Antiguo, Torrent"))).toBe("Casco Antiguo, Torrent, València, España");
  });
  it("sin municipio conocido, busca en València", () => {
    expect(q(anuncio("https://www.yaencontre.com/venta/edificio/inmueble-1-2", "València", "Edificio"))).toBe("València, España");
  });
  it("fuera de la provincia de València añade la suya", () => {
    expect(q(anuncio("https://www.fotocasa.es/es/comprar/edificio/elche/centro/1/d"))).toBe("Elx, Alacant, España");
  });
});
