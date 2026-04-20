import { VocabularyLevel, WordEntry } from "../types";

const LEVELS: VocabularyLevel[] = ["elementary", "a1", "a2", "b1", "b2", "c1", "c2"];

const BASE_WORDS: Array<[english: string, spanish: string, theme: string]> = [
  ["apple", "manzana", "food"],
  ["bread", "pan", "food"],
  ["water", "agua", "food"],
  ["coffee", "cafe", "food"],
  ["milk", "leche", "food"],
  ["cheese", "queso", "food"],
  ["rice", "arroz", "food"],
  ["egg", "huevo", "food"],
  ["salt", "sal", "food"],
  ["soup", "sopa", "food"],
  ["house", "casa", "home"],
  ["door", "puerta", "home"],
  ["window", "ventana", "home"],
  ["table", "mesa", "home"],
  ["chair", "silla", "home"],
  ["bed", "cama", "home"],
  ["kitchen", "cocina", "home"],
  ["bathroom", "bano", "home"],
  ["floor", "piso", "home"],
  ["garden", "jardin", "home"],
  ["mother", "madre", "family"],
  ["father", "padre", "family"],
  ["brother", "hermano", "family"],
  ["sister", "hermana", "family"],
  ["friend", "amigo", "family"],
  ["teacher", "profesor", "people"],
  ["student", "estudiante", "people"],
  ["neighbor", "vecino", "people"],
  ["child", "nino", "people"],
  ["morning", "manana", "time"],
  ["afternoon", "tarde", "time"],
  ["night", "noche", "time"],
  ["today", "hoy", "time"],
  ["tomorrow", "manana siguiente", "time"],
  ["week", "semana", "time"],
  ["month", "mes", "time"],
  ["year", "ano", "time"],
  ["minute", "minuto", "time"],
  ["hour", "hora", "time"],
  ["happy", "feliz", "feelings"],
  ["sad", "triste", "feelings"],
  ["tired", "cansado", "feelings"],
  ["calm", "tranquilo", "feelings"],
  ["angry", "enojado", "feelings"],
  ["hungry", "hambriento", "feelings"],
  ["ready", "listo", "feelings"],
  ["busy", "ocupado", "feelings"],
  ["safe", "seguro", "feelings"],
  ["walk", "caminar", "actions"],
  ["run", "correr", "actions"],
  ["read", "leer", "actions"],
  ["write", "escribir", "actions"],
  ["listen", "escuchar", "actions"],
  ["speak", "hablar", "actions"],
  ["learn", "aprender", "actions"],
  ["study", "estudiar", "actions"],
  ["open", "abrir", "actions"],
  ["close", "cerrar", "actions"],
  ["school", "escuela", "places"],
  ["office", "oficina", "places"],
  ["market", "mercado", "places"],
  ["park", "parque", "places"],
  ["street", "calle", "places"],
  ["city", "ciudad", "places"],
  ["store", "tienda", "places"],
  ["hospital", "hospital", "places"],
  ["beach", "playa", "places"],
  ["station", "estacion", "places"],
  ["sun", "sol", "nature"],
  ["moon", "luna", "nature"],
  ["rain", "lluvia", "nature"],
  ["wind", "viento", "nature"],
  ["tree", "arbol", "nature"],
  ["river", "rio", "nature"],
  ["mountain", "montana", "nature"],
  ["flower", "flor", "nature"],
  ["cloud", "nube", "nature"],
  ["sea", "mar", "nature"],
  ["phone", "telefono", "objects"],
  ["book", "libro", "objects"],
  ["pen", "lapiz", "objects"],
  ["bag", "bolso", "objects"],
  ["clock", "reloj", "objects"],
  ["key", "llave", "objects"],
  ["car", "carro", "objects"],
  ["bus", "autobus", "objects"],
  ["computer", "computadora", "objects"],
  ["camera", "camara", "objects"],
  ["big", "grande", "descriptions"],
  ["small", "pequeno", "descriptions"],
  ["fast", "rapido", "descriptions"],
  ["slow", "lento", "descriptions"],
  ["hot", "caliente", "descriptions"],
  ["cold", "frio", "descriptions"],
  ["clean", "limpio", "descriptions"],
  ["strong", "fuerte", "descriptions"],
  ["easy", "facil", "descriptions"],
  ["bright", "brillante", "descriptions"]
];

export const WORD_BANK: WordEntry[] = LEVELS.flatMap((level, levelIndex) => {
  return BASE_WORDS.map(([english, spanish, theme], wordIndex) => {
    const tieredEnglish = levelIndex === 0 ? english : `${english}-${level}`;
    const context = theme.toLowerCase().replace(/_/g, " ");

    return {
      id: `${level}-${theme}-${wordIndex + 1}`,
      english: tieredEnglish,
      spanish,
      theme,
      level,
      order: levelIndex * 1_000 + wordIndex + 1,
      exampleSentence: buildExampleSentence(tieredEnglish, context, level),
      englishExplanation: `"${tieredEnglish}" is useful when talking about ${context}. It connects with the Spanish idea "${spanish}".`
    };
  });
});

function buildExampleSentence(english: string, context: string, level: VocabularyLevel) {
  const subject = getExampleSubject(level);
  return `${subject} use "${english}" when the lesson turns to ${context}.`;
}

function getExampleSubject(level: VocabularyLevel) {
  switch (level) {
    case "elementary":
      return "I";
    case "a1":
      return "We";
    case "a2":
      return "They";
    case "b1":
      return "Writers";
    case "b2":
      return "Speakers";
    case "c1":
      return "Scholars";
    case "c2":
      return "Masters";
    default:
      return "I";
  }
}
