import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';
import { isAIAvailable } from '../utils/aiSuggestions';

// Crearea contextului AI
const AIContext = createContext();

// Provider pentru contextul AI
export const AIProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [aiEnabled, setAiEnabled] = useState(true);
  const [aiAvailable, setAiAvailable] = useState(false);
  const [aiProvider, setAiProvider] = useState('openai'); // Modificat de la 'claude' la 'openai'
  const [loading, setLoading] = useState(true);

  // Verifică disponibilitatea API-ului la încărcarea aplicației
  useEffect(() => {
    setAiAvailable(isAIAvailable());
  }, []);

  // Obține preferințele utilizatorului din Firestore
  useEffect(() => {
    const fetchUserPreferences = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          // Verificăm dacă există preferința aiEnabled
          if (userData.aiEnabled !== undefined) {
            setAiEnabled(userData.aiEnabled);
          }
        }
      } catch (error) {
        console.error('Eroare la obținerea preferințelor AI:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserPreferences();
  }, [currentUser]);

  // Valorile expuse prin context
  const value = {
    aiEnabled,
    aiAvailable,
    aiProvider,
    loading,
    // Funcții utilitare despre AI care pot fi adăugate aici
    isLocalSuggestionsOnly: !aiAvailable
  };

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
};

// Hook personalizat pentru a accesa contextul AI
export const useAI = () => {
  return useContext(AIContext);
};