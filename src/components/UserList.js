import React, { useState, useEffect } from "react";
import {
  List,
  Typography,
  Paper,
  Box,
  CircularProgress,
  Divider,
  Button,
  Alert
} from "@mui/material";
import { collection, query, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import UserItem from "./UserItem";

const UserList = ({ setSelectedUser }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;

    console.log("Încercare de încărcare a utilizatorilor...");
    
    try {
      // Folosim onSnapshot pentru a obține actualizări în timp real
      const usersCollection = collection(db, "users");
      const q = query(usersCollection);
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        console.log("Snapshot primit, număr documente:", querySnapshot.size);
        
        const usersList = [];
        querySnapshot.forEach((doc) => {
          const userData = doc.data();
          console.log("Document utilizator:", doc.id, userData);
          
          // Exclude utilizatorul curent
          if (doc.id !== currentUser.uid) {
            usersList.push({
              id: doc.id,
              ...userData
            });
          }
        });
        
        console.log("Lista de utilizatori actualizată:", usersList);
        setUsers(usersList);
        setLoading(false);
      }, (err) => {
        console.error("Eroare la ascultarea documentelor:", err);
        setError("Nu s-au putut încărca utilizatorii: " + err.message);
        setLoading(false);
      });
      
      return () => unsubscribe();
    } catch (error) {
      console.error("Eroare la configurarea listener-ului:", error);
      setError("Eroare la configurarea încărcării utilizatorilor: " + error.message);
      setLoading(false);
    }
  }, [currentUser]);

  const refreshUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const usersCollection = collection(db, "users");
      const querySnapshot = await getDocs(query(usersCollection));
      
      console.log("Reîncărcare manuală, număr documente:", querySnapshot.size);
      
      const usersList = [];
      querySnapshot.forEach((doc) => {
        // Exclude utilizatorul curent
        if (doc.id !== currentUser.uid) {
          usersList.push({
            id: doc.id,
            ...doc.data()
          });
        }
      });
      
      setUsers(usersList);
    } catch (error) {
      console.error("Eroare la reîncărcarea utilizatorilor:", error);
      setError("Eroare la reîncărcarea listei: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ height: "100%", overflow: "auto" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 2 }}>
        <Typography variant="h6">Utilizatori</Typography>
        <Button size="small" onClick={refreshUsers}>Reîmprospătează</Button>
      </Box>
      
      {error && <Alert severity="error" sx={{ mx: 2, mb: 2 }}>{error}</Alert>}
      
      <Divider />
      <List sx={{ p: 0 }}>
        {users.length > 0 ? (
          users.map((user) => (
            <UserItem 
              key={user.id} 
              user={user} 
              onSelect={() => setSelectedUser(user)} 
            />
          ))
        ) : (
          <Box sx={{ p: 2, textAlign: "center" }}>
            <Typography sx={{ mb: 2 }}>
              Nu există alți utilizatori disponibili
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Asigură-te că există mai mulți utilizatori conectați și că sunt corect salvați în baza de date.
            </Typography>
          </Box>
        )}
      </List>
    </Paper>
  );
};

export default UserList;