// src/utils/aiSuggestions.js
import { db } from "../firebase/config";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";

// Cheia API OpenAI - încărcată din variabilele de mediu
const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY || "";
const OPENAI_API_URL = process.env.REACT_APP_OPENAI_API_URL || "https://api.openai.com/v1/chat/completions";

/**
 * Cache pentru stocarea temporară a sugestiilor pentru a reduce numărul de apeluri API
 * Structură: { chatId_lastMessageId: { timestamp: Date, suggestions: [] } }
 */
const suggestionsCache = {};

// Numărul de mesaje din istoric care vor fi trimise către OpenAI pentru context
const MAX_HISTORY_MESSAGES = 10;

// Durata de valabilitate a cache-ului în milisecunde (10 minute)
const CACHE_TTL = 10 * 60 * 1000;

/**
 * Obține istoricul conversației pentru a furniza context către API-ul OpenAI
 * @param {string} chatId - ID-ul conversației
 * @param {number} maxMessages - Numărul maxim de mesaje din istoric
 * @returns {Promise<Array>} - Istoricul conversației
 */
export const getChatHistory = async (chatId, maxMessages = MAX_HISTORY_MESSAGES) => {
  try {
    const messagesRef = collection(db, "messages");
    const q = query(
      messagesRef,
      where("chatId", "==", chatId),
      orderBy("createdAt", "desc"),
      limit(maxMessages)
    );

    const snapshot = await getDocs(q);
    const messageHistory = [];

    snapshot.forEach((doc) => {
      const messageData = doc.data();
      const message = {
        id: doc.id,
        text: messageData.text, // Vom decripta acest text în componenta Chat
        senderId: messageData.senderId,
        senderName: messageData.senderName,
        createdAt: messageData.createdAt
      };
      messageHistory.push(message);
    });

    // Inversăm ordinea pentru a avea mesajele în ordine cronologică
    return messageHistory.reverse();
  } catch (error) {
    console.error("Eroare la obținerea istoricului de chat:", error);
    return [];
  }
};

/**
 * Formatează istoricul conversației pentru API-ul OpenAI
 * @param {Array} messages - Mesajele din istoricul conversației
 * @param {string} currentUserId - ID-ul utilizatorului curent
 * @returns {Array} - Istoricul formatat pentru OpenAI
 */
const formatHistoryForOpenAI = (messages, currentUserId) => {
  return messages.map(message => {
    const role = message.senderId === currentUserId ? "user" : "assistant";
    return {
      role,
      content: message.text
    };
  });
};

/**
 * Solicită sugestii de la OpenAI API
 * @param {Array} formattedHistory - Istoricul conversației formatat pentru OpenAI
 * @returns {Promise<Array>} - Lista de sugestii
 */
const fetchOpenAISuggestions = async (formattedHistory) => {
  try {
    const lastMessage = formattedHistory[formattedHistory.length - 1];
    
    // Verificăm dacă ultimul mesaj este de la cealaltă persoană
    if (lastMessage.role === 'assistant') {
      const requestBody = {
        model: "gpt-3.5-turbo", // Modelul gratuit, poți schimba la gpt-4 dacă ai acces
        messages: [
          ...formattedHistory,
          {
            role: "system",
            content: "Oferă trei posibile răspunsuri scurte (maxim 30 de cuvinte fiecare) la ultimul mesaj din conversație. Răspunsurile trebuie să fie relevante, naturale și variate ca ton și conținut. Răspunde doar cu cele trei sugestii separate prin '|', fără explicații suplimentare."
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      };

      console.log("Trimit cerere către OpenAI API:", {
        url: OPENAI_API_URL,
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });

      const response = await fetch(OPENAI_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Eroare de la OpenAI API:", errorData);
        throw new Error("Eroare la obținerea sugestiilor de la OpenAI");
      }

      const data = await response.json();
      console.log("Răspuns de la OpenAI API:", data);

      // Extragem sugestiile din răspunsul OpenAI
      // OpenAI returnează răspunsul în format diferit față de Claude
      const content = data.choices[0].message.content;
      const suggestions = content.split("|").map(s => s.trim());
      return suggestions.filter(s => s.length > 0);
    }
    
    return []; // Nu oferim sugestii dacă ultimul mesaj este de la utilizatorul curent
  } catch (error) {
    console.error("Eroare la obținerea sugestiilor de la OpenAI:", error);
    return [];
  }
};

/**
 * Generează sugestii bazate pe istoricul conversației utilizând OpenAI API
 * @param {string} chatId - ID-ul conversației
 * @param {string} currentUserId - ID-ul utilizatorului curent
 * @param {Array} decryptedMessages - Mesajele decriptate pentru a furniza context
 * @returns {Promise<Array>} - Sugestii de răspuns
 */
export const getAISuggestions = async (chatId, currentUserId, decryptedMessages) => {
  try {
    if (!decryptedMessages || decryptedMessages.length === 0) {
      return [];
    }

    const lastMessage = decryptedMessages[decryptedMessages.length - 1];
    
    // Verificăm dacă ultimul mesaj este de la cealaltă persoană (nu de la utilizatorul curent)
    if (lastMessage.senderId === currentUserId) {
      return []; // Nu oferim sugestii dacă ultimul mesaj este de la utilizatorul curent
    }

    // Verificăm cache-ul pentru a reduce apelurile API
    const cacheKey = `${chatId}_${lastMessage.id}`;
    const cachedResult = suggestionsCache[cacheKey];
    
    if (cachedResult && (new Date() - cachedResult.timestamp) < CACHE_TTL) {
      console.log("Utilizez sugestii din cache");
      return cachedResult.suggestions;
    }

    // Formatăm mesajele pentru OpenAI API
    const formattedHistory = formatHistoryForOpenAI(decryptedMessages, currentUserId);
    
    // Obținem sugestii de la OpenAI
    const suggestions = await fetchOpenAISuggestions(formattedHistory);
    
    // Actualizăm cache-ul
    suggestionsCache[cacheKey] = {
      timestamp: new Date(),
      suggestions
    };
    
    return suggestions;
  } catch (error) {
    console.error("Eroare la generarea sugestiilor AI:", error);
    return [];
  }
};

/**
 * Funcție de fallback pentru a genera sugestii locale când API-ul nu este disponibil
 * @param {Array} messages - Mesajele din conversație
 * @returns {Array} - Lista de sugestii generate local
 */
export const getLocalSuggestions = (messages) => {
  if (!messages || messages.length === 0) {
    return [];
  }

  // Obține ultimul mesaj
  const lastMessage = messages[messages.length - 1];
  
  // Verifică dacă ultimul mesaj este de la cealaltă persoană
  if (lastMessage.isOwn) {
    return [];
  }

  // Sugestii predefinite generale
  const generalSuggestions = [
    "Înțeleg. Poți să-mi spui mai multe?",
    "Mulțumesc pentru informații!",
    "Interesant, nu știam asta."
  ];
  
  // Detectează tipuri specifice de mesaje și oferă răspunsuri relevante
  const text = lastMessage.text.toLowerCase();
  
  // Salutări
  if (text.match(/bun[aă]\s+(ziua|diminea[tț]a|seara)/i) || 
      text.match(/salut|hey|hello|hi|ceau|servus/i)) {
    return [
      `Bună, mă bucur să te văd! Ce mai faci?`,
      `Salut! Cum îți merge astăzi?`,
      `Hey! Ce planuri ai pentru azi?`
    ];
  }
  
  // Întrebări despre stare/dispoziție
  if (text.includes("cum ești") || text.includes("ce faci") || text.includes("ce mai faci")) {
    return [
      "Sunt bine, mulțumesc! Tu ce mai faci?",
      "Totul merge bine, sunt ocupat cu proiectele. Tu cum ești?",
      "Bine, așteptam să vorbim! Ce noutăți ai?"
    ];
  }
  
  // Solicitări/Cereri
  if (text.includes("te rog") || text.includes("poți") || text.includes("ai putea")) {
    return [
      "Sigur, cu plăcere! Te pot ajuta.",
      "Nicio problemă, te ajut imediat.",
      "Da, desigur. Spune-mi mai exact ce ai nevoie."
    ];
  }
  
  // Mulțumiri
  if (text.match(/mul[tț]umesc|mersi|thanks/i)) {
    return [
      "Cu plăcere! Mă bucur că te-am putut ajuta.",
      "Nicio problemă, oricând ai nevoie.",
      "Pentru puțin! Dacă mai ai întrebări, sunt aici."
    ];
  }
  
  // Întrebări profesionale/studii
  if (text.includes("curs") || text.includes("examen") || text.includes("facultate") || 
      text.includes("proiect") || text.includes("laborator") || text.includes("temă")) {
    return [
      "Am înțeles situația. Aș putea să te ajut cu asta dacă îmi dai mai multe detalii.",
      "Sunt familiarizat cu acest subiect. Ce anume te interesează să afli?",
      "Bună întrebare! Hai să discutăm mai în detaliu despre asta."
    ];
  }
  
  // Programare/Întâlnire
  if (text.includes("disponibil") || text.includes("întâlni") || text.includes("ora") || 
      text.includes("întâlnire") || text.includes("mâine") || text.includes("azi")) {
    return [
      "Sunt disponibil mâine după ora 14:00. Ți-ar conveni?",
      "Astăzi după ora 16:00 aș putea să mă întâlnesc cu tine. Ce zici?",
      "Verifică-mi, te rog, programul și stabilim o întâlnire cât mai curând."
    ];
  }
  
  // Orice întrebare
  if (text.endsWith("?")) {
    return [
      "Da, cred că ai dreptate în această privință.",
      "Interesantă întrebare! Lasă-mă să mă gândesc puțin...",
      "Nu sunt sigur, dar pot să aflu mai multe informații pentru tine."
    ];
  }

  // Probleme și dificultăți
  if (text.includes("problema") || text.includes("dificil") || text.includes("complicat") || 
      text.includes("nu merge") || text.includes("eroare")) {
    return [
      "Înțeleg problema. Hai să vedem împreună cum o putem rezolva.",
      "Am întâmpinat și eu probleme similare. Pot să-ți sugerez o soluție.",
      "Nu-ți face griji, majoritatea problemelor au o soluție simplă."
    ];
  }
  
  // Recomandări
  if (text.includes("recomand") || text.includes("sugerez") || text.includes("sfat")) {
    return [
      "Apreciez recomandarea ta! O voi lua în considerare.",
      "Mulțumesc pentru sugestie, pare o idee foarte bună.",
      "E un sfat util, chiar aveam nevoie de o perspectivă nouă."
    ];
  }
  
  // Pentru contexte emoționale
  if (text.includes("trist") || text.includes("supărat") || text.includes("nervos") || 
      text.includes("fericit") || text.includes("bucuros")) {
    return [
      "Înțeleg cum te simți. Vrei să vorbim despre asta?",
      "E normal să te simți așa. Sunt aici dacă ai nevoie de cineva cu care să vorbești.",
      "Emoțiile tale sunt importante. Cum te pot ajuta?"
    ];
  }
  
  // Dacă nu se potrivește niciunul dintre modelele de mai sus, returnează sugestii generale
  return generalSuggestions;
};

/**
 * Verifică dacă funcționalitatea de AI este disponibilă
 * @returns {boolean} - Stare disponibilitate
 */
export const isAIAvailable = () => {
  // Verificăm dacă cheia API este validă (nu este placeholder-ul inițial)
  return OPENAI_API_KEY && OPENAI_API_KEY !== "";
};