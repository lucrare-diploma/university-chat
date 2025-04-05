import { createContext, useContext, useEffect, useState } from "react";
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { auth, googleProvider, db } from "../firebase/config";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Autentificare cu Google
  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Eroare la autentificare:", error);
    }
  };

  // Deconectare
  const logout = async () => {
    try {
      // Actualizăm statusul la offline înainte de deconectare
      if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);
        await setDoc(
          userRef,
          { online: false, lastActive: serverTimestamp() },
          { merge: true }
        );
        console.log("Status actualizat la offline înainte de deconectare");
      }
      
      // Apoi efectuăm deconectarea
      await signOut(auth);
    } catch (error) {
      console.error("Eroare la deconectare:", error);
    }
  };

  // Verifică statusul autentificării
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signInWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};