import React, { useState, useEffect } from "react";
import {
  List,
  Typography,
  Box,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
  InputBase,
  IconButton,
  alpha
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import { collection, query, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import UserItem from "./UserItem";

const UserList = ({ setSelectedUser }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { currentUser } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

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
        setFilteredUsers(usersList);
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

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        user.displayName && user.displayName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

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
      setFilteredUsers(usersList);
    } catch (error) {
      console.error("Eroare la reîncărcarea utilizatorilor:", error);
      setError("Eroare la reîncărcarea listei: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3, height: "100%" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ 
        p: 2, 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        borderBottom: 1,
        borderColor: "divider"
      }}>
        <Typography variant="h6" sx={{ fontSize: isMobile ? "1.1rem" : "1.25rem" }}>
          Utilizatori
        </Typography>
        <IconButton size="small" onClick={refreshUsers} aria-label="Reîmprospătează lista">
          <RefreshIcon />
        </IconButton>
      </Box>
      
      <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: "divider" }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          bgcolor: (theme) => alpha(theme.palette.common.black, 0.05),
          borderRadius: 1,
          px: 1
        }}>
          <InputBase
            placeholder="Caută utilizatori..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ ml: 1, flex: 1, fontSize: "0.9rem" }}
          />
          <IconButton type="button" sx={{ p: '10px' }} aria-label="search">
            <SearchIcon />
          </IconButton>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mx: 2, my: 1 }}>{error}</Alert>}
      
      <Box sx={{ flexGrow: 1, overflow: "auto" }}>
        <List sx={{ p: 0 }}>
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <UserItem 
                key={user.id} 
                user={user} 
                onSelect={() => setSelectedUser(user)} 
              />
            ))
          ) : (
            <Box sx={{ p: 2, textAlign: "center" }}>
              <Typography sx={{ mb: 2 }}>
                {searchTerm ? "Niciun rezultat găsit" : "Nu există alți utilizatori disponibili"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchTerm 
                  ? "Încearcă alte cuvinte cheie"
                  : "Asigură-te că există mai mulți utilizatori conectați și că sunt corect salvați în baza de date."
                }
              </Typography>
            </Box>
          )}
        </List>
      </Box>
    </Box>
  );
};

export default UserList;