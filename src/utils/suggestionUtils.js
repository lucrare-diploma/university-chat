// src/utils/suggestionUtils.js

// Set de cuvinte frecvente în română pentru sugestii
const commonWords = {
  // Întrebări și cuvinte de început
  unde: ["este", "sunt", "ești", "se", "se află", "ai", "mergem"],
  cum: ["te", "ești", "este", "sunt", "faci", "merge", "ai", "procedăm"],
  ce: ["faci", "mai", "zici", "crezi", "spui", "se", "este", "ai"],
  când: ["vii", "vine", "începe", "ajungi", "terminăm", "plecăm", "este"],
  cine: ["este", "sunt", "ești", "a", "va", "poate", "vine"],
  de: ["ce", "unde", "când", "cine", "acord", "la", "exemplu"],
  la: ["ce", "oră", "mine", "tine", "facultate", "laborator", "curs"],
  te: ["rog", "aștept", "sun", "ajut", "întreb", "văd"],
  vă: ["rog", "aștept", "mulțumesc", "întreb", "invit"],
  ai: ["timp", "văzut", "auzit", "terminat", "înțeles", "reușit"],
  am: ["nevoie", "înțeles", "terminat", "văzut", "auzit", "fost"],
  o: ["să", "zi", "seară", "idee", "problemă", "întrebare"],
  îmi: ["poți", "dai", "spui", "trimiți", "explici", "arăți"],
  îți: ["mulțumesc", "trimit", "explic", "spun", "amintesc"],
  este: ["posibil", "important", "necesar", "gata", "disponibil"],

  // Conectori și tranziții
  dar: ["nu", "dacă", "ce", "cum", "am", "ai", "este"],
  dacă: ["ai", "nu", "vrei", "poți", "este", "am", "va"],
  pentru: ["că", "a", "mine", "tine", "noi", "examen", "laborator"],
  însă: ["nu", "este", "trebuie", "am", "ai", "avem"],
  deci: ["cum", "ce", "când", "unde", "putem", "ar"],
  așa: ["că", "cum", "este", "încât", "de"],
  așadar: ["cum", "putem", "ar", "trebuie", "vom"],
  totuși: ["nu", "cred", "am", "ai", "este", "ar"],
  apoi: ["vom", "o", "am", "trebuie", "putem"],

  // Timp și programare
  azi: ["la", "este", "am", "avem", "putem", "ne", "vă"],
  mâine: ["la", "vom", "ne", "vă", "o", "putem", "am"],
  acum: ["trebuie", "este", "am", "pot", "nu", "să"],
  după: ["ce", "aceea", "curs", "examen", "laborator"],
  înainte: ["de", "să", "am", "ai", "ca"],
  până: ["la", "când", "mâine", "atunci", "acum"],

  // Conversații universitare
  examenul: ["de", "la", "pentru", "este", "va", "începe"],
  cursul: ["de", "la", "este", "va", "începe", "s-a"],
  laboratorul: ["de", "la", "este", "va", "începe", "s-a"],
  profesorul: ["a", "de", "ne-a", "va", "este", "nu"],
  tema: ["pentru", "de", "la", "este", "am", "ai"],
  proiectul: ["de", "la", "este", "trebuie", "am", "ai"],
  grupa: ["noastră", "ta", "de", "va", "are", "s-a"],
  facultatea: ["de", "noastră", "are", "va", "este"],
  biblioteca: ["este", "are", "va", "se", "închide", "deschide"],
  sesiunea: ["de", "începe", "se", "va", "este", "s-a"],

  // Afirmații și negații
  da: ["sigur", "desigur", "bineînțeles", "pot", "am", "voi"],
  nu: ["pot", "am", "știu", "cred", "înțeleg", "vreau"],
  poate: ["că", "fi", "ar", "vom", "mâine", "azi"],
  sigur: ["că", "voi", "vom", "poți", "nu", "da"],
  bine: ["dar", "și", "atunci", "ne", "te", "că"],
  ok: ["atunci", "dar", "și", "te", "ne", "mulțumesc"],
  mulțumesc: ["pentru", "mult", "frumos", "anticipat", "că"],

  // Formule de salut
  salut: ["ce", "cum", "ai", "ești", "mai", "te"],
  bună: ["ziua", "dimineața", "seara", "ce", "cum", "ești"],
  hey: ["ce", "cum", "ai", "ești", "mai", "te"],
  hello: ["ce", "cum", "ai", "ești", "mai", "te"],
  pa: ["pa", "și", "ne", "te", "mâine", "curând"],
  la: ["revedere", "mulți", "ani", "noapte", "prânz"],
};

/**
 * Generează sugestii de cuvinte bazate pe ultimul cuvânt scris
 * @param {string} text - Textul actual al mesajului
 * @returns {Array} - Lista de sugestii de cuvinte
 */
export const generateSuggestions = (text) => {
  if (!text || text.trim() === "") return [];

  // Obținem ultimul cuvânt scris
  const words = text.trim().split(/\s+/);
  const lastWord = words[words.length - 1].toLowerCase();

  // Returnăm sugestiile pentru ultimul cuvânt
  if (lastWord in commonWords) {
    return commonWords[lastWord];
  }

  // Dacă nu avem sugestii exacte, verificăm dacă cuvântul începe cu caractere similare
  const similarSuggestions = [];
  for (const word in commonWords) {
    if (word.startsWith(lastWord) && lastWord.length >= 2) {
      // Adăugăm cuvântul complet ca sugestie
      similarSuggestions.push(word);
    }
  }

  return similarSuggestions.slice(0, 3); // Returnăm maxim 3 sugestii
};

/**
 * Aplică o sugestie la textul curent
 * @param {string} text - Textul actual
 * @param {string} suggestion - Sugestia selectată
 * @returns {string} - Textul nou cu sugestia aplicată
 */
export const applySuggestion = (text, suggestion) => {
  if (!text || !suggestion) return text;

  // Împărțim textul în cuvinte
  const words = text.trim().split(/\s+/);

  // Adăugăm sugestia după ultimul cuvânt
  if (words.length > 0) {
    const lastWord = words[words.length - 1].toLowerCase();

    // Verificăm dacă ultimul cuvânt e în lista de sugestii
    if (lastWord in commonWords) {
      // Înlocuim ultimul cuvânt cu sugestia și adăugăm un spațiu
      return text + " " + suggestion + " ";
    }
    // Verificăm dacă ultimul cuvânt este începutul unei sugestii
    else if (
      Object.keys(commonWords).some((word) => word.startsWith(lastWord)) &&
      lastWord.length >= 2
    ) {
      // Înlocuim ultimul cuvânt parțial cu cuvântul complet
      words.pop(); // Eliminăm ultimul cuvânt
      return words.join(" ") + (words.length > 0 ? " " : "") + suggestion + " ";
    }
  }

  // Dacă nu se potrivește nimic, doar adăugăm sugestia la sfârșitul textului
  return text + (text.endsWith(" ") ? "" : " ") + suggestion + " ";
};

// În suggestionUtils.js

// Funcție pentru a învăța din mesajele anterioare
export const learnFromMessage = (text, userDictionary) => {
  if (!text || text.trim() === "") return userDictionary;

  const words = text.trim().split(/\s+/);
  const newDictionary = { ...userDictionary };

  for (let i = 0; i < words.length - 1; i++) {
    const currentWord = words[i].toLowerCase();
    const nextWord = words[i + 1].toLowerCase();

    if (!newDictionary[currentWord]) {
      newDictionary[currentWord] = [nextWord];
    } else if (!newDictionary[currentWord].includes(nextWord)) {
      newDictionary[currentWord].push(nextWord);
    }
  }

  return newDictionary;
};
