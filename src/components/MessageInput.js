import React, { useState } from "react";
import { Box, TextField, IconButton, CircularProgress, InputAdornment, Tooltip } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import LockIcon from "@mui/icons-material/Lock";

const MessageInput = ({ onSendMessage, isMobile }) => {
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
        p: isMobile ? 1.5 : 2,
        backgroundColor: "background.paper",
        display: "flex",
        alignItems: "center",
        borderTop: 1,
        borderColor: "divider"
      }}
    >
      {!isMobile && (
        <IconButton sx={{ mr: 1 }} color="default">
          <AttachFileIcon />
        </IconButton>
      )}
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Scrie un mesaj criptat..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        multiline
        maxRows={3}
        size={isMobile ? "small" : "medium"}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Tooltip title="Mesajele sunt criptate end-to-end">
                <LockIcon fontSize="small" color="success" sx={{ opacity: 0.7 }} />
              </Tooltip>
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton color="default" size="small">
                <EmojiEmotionsIcon />
              </IconButton>
            </InputAdornment>
          )
        }}
        sx={{ 
          mr: 1,
          "& .MuiOutlinedInput-root": {
            borderRadius: 3,
            fontSize: isMobile ? "0.95rem" : "1rem",
          }
        }}
        autoFocus
      />
      <IconButton 
        color="primary" 
        type="submit" 
        disabled={!message.trim() || sending}
        size={isMobile ? "medium" : "large"}
        sx={{
          backgroundColor: message.trim() && !sending ? "primary.main" : "action.disabledBackground",
          color: "white",
          "&:hover": {
            backgroundColor: "primary.dark",
          },
          width: isMobile ? 40 : 48,
          height: isMobile ? 40 : 48
        }}
      >
        {sending ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
      </IconButton>
    </Box>
  );
};

export default MessageInput;