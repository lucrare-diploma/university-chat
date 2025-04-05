import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  Typography,
  Paper,
  Divider,
  Avatar,
  AppBar,
  Toolbar,
  IconButton,
  useTheme,
  useMediaQuery,
  Badge,
  CircularProgress,
  Tooltip
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import LockIcon from "@mui/icons-material/Lock";
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
import { encryptMessage, decryptMessage, generateChatKey } from "../utils/encryption";

const Chat = ({ selectedUser, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();
  const messagesEndRef = useRef(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [chatKey, setChatKey] = useState('');

  // Generează ID-ul conversației - sortează ID-urile utilizatorilor pentru consistență
  const getChatId = useCallback(() => {
    const ids = [currentUser.uid, selectedUser.id].sort();
    return `${ids[0]}_${ids[1]}`;
  }, [currentUser, selectedUser]);

  // Generate encryption key for this chat when users are selected
  useEffect(() => {
    if (currentUser && selectedUser) {
      const key = generateChatKey(currentUser.uid, selectedUser.id);
      setChatKey(key);
      console.log("Cheia de criptare a fost generată pentru conversație");
    }
  }, [currentUser, selectedUser]);

  // Funcție pentru a derula la ultimul mesaj
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Încarcă mesajele în timp real
  useEffect(() => {
    if (!selectedUser || !currentUser || !chatKey) return;
    
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
          
          // Decrypt the message text if it's encrypted
          let decryptedText = messageData.text;
          if (messageData.encrypted) {
            decryptedText = decryptMessage(messageData.text, chatKey);
          }
            
          messagesList.push({
            id: doc.id,
            ...messageData,
            text: decryptedText, // Replace encrypted text with decrypted text
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
  }, [currentUser, selectedUser, getChatId, chatKey]);

  // Derulează automat la ultimul mesaj când se adaugă mesaje noi
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Trimite un mesaj
  const handleSendMessage = async (text) => {
    if (!text.trim() || !currentUser || !selectedUser || !chatKey) return;

    try {
      const chatId = getChatId();
      console.log("Trimit mesaj criptat în chat ID:", chatId);
      
      // Encrypt the message before saving to Firestore
      const encryptedText = encryptMessage(text, chatKey);
      
      if (!encryptedText) {
        throw new Error("Encryption failed");
      }
      
      // Adaugă mesajul în colecția de mesaje
      await addDoc(collection(db, "messages"), {
        text: encryptedText,
        encrypted: true, // Flag that indicates this message is encrypted
        senderId: currentUser.uid,
        receiverId: selectedUser.id,
        senderName: currentUser.displayName || "Utilizator",
        senderPhoto: currentUser.photoURL,
        chatId,
        createdAt: serverTimestamp() // Folosește serverTimestamp pentru consistență
      });
      
      console.log("Mesaj criptat trimis cu succes");
    } catch (error) {
      console.error("Eroare la trimiterea mesajului:", error);
      setError("Nu s-a putut trimite mesajul: " + error.message);
    }
  };

  const badgeStatus = selectedUser?.online ? "success" : "default";

  return (
    <Paper 
      sx={{ 
        height: "100%", 
        display: "flex", 
        flexDirection: "column",
        borderRadius: 0
      }}
      elevation={0}
    >
      <AppBar 
        position="static" 
        color="default" 
        elevation={1}
        sx={{
          backgroundColor: "background.paper",
          borderBottom: 1,
          borderColor: "divider"
        }}
      >
        <Toolbar sx={{ minHeight: isMobile ? 56 : 64 }}>
          <IconButton 
            edge="start" 
            color="inherit" 
            onClick={onBack} 
            sx={{ mr: 2 }}
            aria-label="înapoi"
          >
            <ArrowBackIcon />
          </IconButton>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            variant="dot"
            color={badgeStatus}
          >
            <Avatar 
              src={selectedUser?.photoURL} 
              alt={selectedUser?.displayName}
              sx={{ 
                mr: 2,
                width: isMobile ? 40 : 48, 
                height: isMobile ? 40 : 48
              }}
            >
              {selectedUser?.displayName?.charAt(0) || "U"}
            </Avatar>
          </Badge>
          <Box sx={{ flexGrow: 1 }}>
            <Typography 
              variant="h6"
              sx={{ fontSize: isMobile ? "1rem" : "1.25rem" }}
            >
              {selectedUser?.displayName}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: isMobile ? "0.75rem" : "0.875rem" }}
            >
              {selectedUser?.online ? "Online" : "Offline"}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title="Mesaje criptate end-to-end">
              <LockIcon fontSize="small" color="success" sx={{ mr: 1 }} />
            </Tooltip>
            <IconButton color="inherit" aria-label="opțiuni">
              <MoreVertIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ position: 'relative' }}>
        <Box sx={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          py: 0.5,
          zIndex: 5,
          bgcolor: 'rgba(0, 0, 0, 0.03)'
        }}>
          <Tooltip title="Mesajele sunt criptate end-to-end">
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              fontSize: isMobile ? '0.7rem' : '0.8rem',
              color: 'text.secondary',
              px: 1,
              borderRadius: 10,
            }}>
              <LockIcon sx={{ fontSize: isMobile ? '0.7rem' : '0.8rem', mr: 0.5 }} />
              Conversație criptată
            </Box>
          </Tooltip>
        </Box>
      </Box>
      
      <Box sx={{ 
        flexGrow: 1, 
        overflow: "auto", 
        p: isMobile ? 1.5 : 2, 
        display: "flex", 
        flexDirection: "column",
        bgcolor: "background.default",
        mt: 3
      }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
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
              isMobile={isMobile}
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
      <MessageInput onSendMessage={handleSendMessage} isMobile={isMobile} />
    </Paper>
  );
};

export default Chat;