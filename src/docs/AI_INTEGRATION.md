# Documentație pentru Integrarea AI în USV Chat

Acest document detaliază integrarea funcționalităților de sugestii AI în aplicația USV Chat, utilizând API-ul OpenAI.

## Prezentare generală

Aplicația integrează API-ul OpenAI GPT-3.5 pentru a oferi sugestii de răspunsuri inteligente în conversațiile dintre utilizatori. Sistemul analizează istoricul conversațiilor și generează răspunsuri contextuale.

### Componente principale:

1. **Serviciul AI** (`src/utils/aiSuggestions.js`)
   - Gestionează conexiunea cu API-ul OpenAI
   - Furnizează funcții de fallback locale când API-ul nu este disponibil

2. **Contextul AI** (`src/context/AIContext.js`)
   - Partajează starea AI în întreaga aplicație
   - Verifică disponibilitatea serviciului AI

3. **Interfața utilizator**
   - Afișează sugestiile în componenta de introducere a mesajelor
   - Permite activarea/dezactivarea funcționalității din pagina de profil

## Configurare API OpenAI

Pentru a utiliza API-ul OpenAI trebuie să:

1. Creați un cont pe [OpenAI Platform](https://platform.openai.com)
2. Obțineți o cheie API (noile conturi primesc un credit gratuit)
3. Creați un fișier `.env.local` în directorul rădăcină al proiectului
4. Adăugați următoarea linie în fișier: