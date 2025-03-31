import React, { useEffect } from "react";
import { Box, CssBaseline, AppBar, Toolbar, Typography, Button, Avatar } from "@mui/material";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase/config";
import Auth from "./components/Auth";
import ChatList from "./components/ChatList";
import { ref, onDisconnect, getDatabase } from "firebase/database";
import { rtdb } from "./firebase/config";

// Componenta pentru layout-ul când utilizatorul este autentificat
const AuthenticatedLayout = () => {
  const { currentUser, logout } = useAuth();

  // Salvează informațiile utilizatorului în Firestore
  useEffect(() => {
    const saveUserToFirestore = async () => {
      if (currentUser) {
        try {
          console.log("Salvez utilizatorul în Firestore:", currentUser.uid);
          const userRef = doc(db, "users", currentUser.uid);
          await setDoc(
            userRef,
            {
              displayName: currentUser.displayName || "Utilizator necunoscut",
              email: currentUser.email,
              photoURL: currentUser.photoURL,
              lastActive: serverTimestamp(),
              online: true, // Adăugăm un câmp pentru a marca utilizatorii online
              uid: currentUser.uid // Adăugăm UID-ul explicit pentru referințe mai ușoare
            },
            { merge: true }
          );

          const unsubscribePresence = onDisconnect(
            ref(getDatabase(), `status/${currentUser.uid}`)
          ).set("offline");

          console.log("Utilizatorul a fost salvat în Firestore");
        } catch (error) {
          console.error("Eroare la salvarea utilizatorului:", error);
        }
      }
    };

    saveUserToFirestore();
    return () => {
      if (currentUser) {
        // Actualizăm statusul la offline când componentul este demontat
        try {
          const userRef = doc(db, "users", currentUser.uid);
          setDoc(
            userRef,
            { online: false, lastActive: serverTimestamp() },
            { merge: true }
          );
        } catch (error) {
          console.error("Eroare la actualizarea statusului offline:", error);
        }
      }
    };
  }, [currentUser]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Chat App
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography variant="body1" sx={{ mr: 2 }}>
              {currentUser?.displayName}
            </Typography>
            <Avatar 
              src={currentUser?.photoURL} 
              alt={currentUser?.displayName}
              sx={{ mr: 2 }}
            >
              {currentUser?.displayName?.charAt(0) || "U"}
            </Avatar>
            <Button color="inherit" onClick={logout}>
              Deconectare
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
      <ChatList />
    </Box>
  );
};

// Componenta principală
const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

// Conținut bazat pe starea autentificării
const AppContent = () => {
  const { currentUser } = useAuth();

  return currentUser ? <AuthenticatedLayout /> : <Auth />;
};

export default App;