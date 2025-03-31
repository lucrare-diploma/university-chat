import React, { useState } from "react";
import { Box, TextField, IconButton } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";

const MessageInput = ({ onSendMessage }) => {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim() || sending) return;
    
    try {
      setSending(true);
      // Salvăm mesajul într-o variabilă temporară și curățăm input-ul imediat
      // pentru o experiență de utilizare mai bună
      const messageText = message;
      setMessage("");
      
      // Trimitem mesajul
      await onSendMessage(messageText);
    } catch (error) {
      console.error("Eroare la trimiterea mesajului:", error);
      // Dacă apare o eroare, restaurăm mesajul în input
      setMessage(message);
    } finally {
      setSending(false);
    }
  };

  // Handler pentru tasta Enter
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        p: 2,
        backgroundColor: "background.paper",
        display: "flex"
      }}
    >
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Scrie un mesaj..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        multiline
        maxRows={3}
        sx={{ mr: 1 }}
        autoFocus
      />
      <IconButton 
        color="primary" 
        type="submit" 
        disabled={!message.trim() || sending}
      >
        <SendIcon />
      </IconButton>
    </Box>
  );
};

export default MessageInput;