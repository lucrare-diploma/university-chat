import React from "react";
import { Box, Typography, Avatar, Paper, Tooltip } from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";

const Message = ({ message, isOwn }) => {
  // Formatul datei și orei pentru mesaje
  const formatTime = (date) => {
    if (!date) return "";
    
    try {
      // Verifică dacă este un obiect Date valid
      const messageDate = date instanceof Date ? date : new Date(date);
      
      if (isNaN(messageDate.getTime())) {
        return ""; // Data invalidă
      }
      
      return messageDate.toLocaleTimeString([], { 
        hour: "2-digit", 
        minute: "2-digit" 
      });
    } catch (error) {
      console.error("Eroare la formatarea datei:", error);
      return "";
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: isOwn ? "flex-end" : "flex-start",
        mb: 2
      }}
    >
      {!isOwn && (
        <Avatar
          src={message.senderPhoto}
          alt={message.senderName}
          sx={{ mr: 1 }}
        >
          {message.senderName?.charAt(0) || "U"}
        </Avatar>
      )}
      <Paper
        sx={{
          p: 2,
          maxWidth: "70%",
          backgroundColor: isOwn ? "primary.light" : "background.paper",
          color: isOwn ? "white" : "inherit",
          borderRadius: 2
        }}
      >
        <Typography variant="body1">{message.text}</Typography>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 0.5 }}>
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            {formatTime(message.createdAt)}
          </Typography>
          {message.encrypted && (
            <Tooltip title="Mesaj criptat">
              <LockIcon fontSize="small" sx={{ ml: 1, opacity: 0.7, width: 14, height: 14 }} />
            </Tooltip>
          )}
        </Box>
      </Paper>
      {isOwn && (
        <Avatar
          src={message.senderPhoto}
          alt={message.senderName}
          sx={{ ml: 1 }}
        >
          {message.senderName?.charAt(0) || "U"}
        </Avatar>
      )}
    </Box>
  );
};

export default Message;