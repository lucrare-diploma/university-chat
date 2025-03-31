import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  Typography,
  Paper,
  Divider,
  Avatar,
  AppBar,
  Toolbar,
  IconButton
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  where, 
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import Message from "./Message";
import MessageInput from "./MessageInput";

const Chat = ({ selectedUser, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const messagesEndRef = useRef(null);
  const [error, setError] = useState(null);

  // Generează ID-ul conversației - sortează ID-urile utilizatorilor pentru consistență
  const getChatId = useCallback(() => {
    const ids = [currentUser.uid, selectedUser.id].sort();
    return `${ids[0]}_${ids[1]}`;
  }, [currentUser, selectedUser]);

  // Funcție pentru a derula la ultimul mesaj
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Încarcă mesajele în timp real
  useEffect(() => {
    if (!selectedUser || !currentUser) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log("Încărcare mesaje pentru conversația între", currentUser.uid, "și", selectedUser.id);
      const chatId = getChatId();
      console.log("Chat ID:", chatId);
      
      const messagesRef = collection(db, "messages");
      const q = query(
        messagesRef,
        where("chatId", "==", chatId),
        orderBy("createdAt", "asc")
      );

      console.log("Configurez listener pentru mesaje...");
      const unsubscribe = onSnapshot(q, (snapshot) => {
        console.log("Snapshot de mesaje primit, număr:", snapshot.size);
        const messagesList = [];
        
        snapshot.forEach((doc) => {
          const messageData = doc.data();
          // Verific dacă createdAt există și este un timestamp valid
          const createdAt = messageData.createdAt ? 
            (messageData.createdAt.toDate ? messageData.createdAt.toDate() : messageData.createdAt) 
            : new Date();
            
          messagesList.push({
            id: doc.id,
            ...messageData,
            createdAt
          });
        });
        
        console.log("Mesaje procesate:", messagesList.length);
        setMessages(messagesList);
        setLoading(false);
        
        // Derulează la ultimul mesaj după ce se încarcă
        setTimeout(scrollToBottom, 100);
      }, (err) => {
        console.error("Eroare la ascultarea mesajelor:", err);
        setError("Nu s-au putut încărca mesajele: " + err.message);
        setLoading(false);
      });
      
      return () => {
        console.log("Curățare listener mesaje");
        unsubscribe();
      };
    } catch (error) {
      console.error("Eroare la configurarea listener-ului pentru mesaje:", error);
      setError("Eroare la configurare: " + error.message);
      setLoading(false);
    }
  }, [currentUser, selectedUser, getChatId]);

  // Derulează automat la ultimul mesaj când se adaugă mesaje noi
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Trimite un mesaj
  const handleSendMessage = async (text) => {
    if (!text.trim() || !currentUser || !selectedUser) return;

    try {
      const chatId = getChatId();
      console.log("Trimit mesaj în chat ID:", chatId);
      
      // Adaugă mesajul în colecția de mesaje
      await addDoc(collection(db, "messages"), {
        text,
        senderId: currentUser.uid,
        receiverId: selectedUser.id,
        senderName: currentUser.displayName || "Utilizator",
        senderPhoto: currentUser.photoURL,
        chatId,
        createdAt: serverTimestamp() // Folosește serverTimestamp pentru consistență
      });
      
      console.log("Mesaj trimis cu succes");
    } catch (error) {
      console.error("Eroare la trimiterea mesajului:", error);
      setError("Nu s-a putut trimite mesajul: " + error.message);
    }
  };

  return (
    <Paper sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={onBack} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Avatar 
            src={selectedUser?.photoURL} 
            alt={selectedUser?.displayName}
            sx={{ mr: 2 }}
          >
            {selectedUser?.displayName?.charAt(0) || "U"}
          </Avatar>
          <Typography variant="h6">{selectedUser?.displayName}</Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ 
        flexGrow: 1, 
        overflow: "auto", 
        p: 2, 
        display: "flex", 
        flexDirection: "column"
      }}>
        {loading ? (
          <Typography sx={{ textAlign: "center", my: 2 }}>
            Se încarcă mesajele...
          </Typography>
        ) : error ? (
          <Typography color="error" sx={{ textAlign: "center", my: 2 }}>
            {error}
          </Typography>
        ) : messages.length > 0 ? (
          messages.map((message) => (
            <Message
              key={message.id}
              message={message}
              isOwn={message.senderId === currentUser.uid}
            />
          ))
        ) : (
          <Typography 
            sx={{ 
              textAlign: "center", 
              color: "text.secondary",
              mt: 4 
            }}
          >
            Nicio conversație încă. Trimite primul mesaj!
          </Typography>
        )}
        
        {/* Referință pentru derulare automată */}
        <div ref={messagesEndRef} />
      </Box>

      <Divider />
      <MessageInput onSendMessage={handleSendMessage} />
    </Paper>
  );
};

export default Chat;