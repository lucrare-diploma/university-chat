import React from "react";
import { Box, Typography, Avatar, Paper, Tooltip } from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

const Message = ({ message, isOwn, isMobile }) => {
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

  const avatarSize = isMobile ? 28 : 36;
  const maxWidth = isMobile ? "85%" : "70%";

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: isOwn ? "flex-end" : "flex-start",
        mb: 1.5,
        px: 0.5
      }}
    >
      {!isOwn && (
        <Avatar
          src={message.senderPhoto}
          alt={message.senderName}
          sx={{ 
            mr: 1, 
            width: avatarSize, 
            height: avatarSize,
            alignSelf: "flex-end",
            mb: 0.5
          }}
        >
          {message.senderName?.charAt(0) || "U"}
        </Avatar>
      )}
      <Paper
        elevation={1}
        sx={{
          p: isMobile ? 1.5 : 2,
          maxWidth: maxWidth,
          backgroundColor: isOwn ? "primary.light" : "background.paper",
          color: isOwn ? "white" : "inherit",
          borderRadius: 2,
          borderTopRightRadius: isOwn ? 0 : 2,
          borderTopLeftRadius: !isOwn ? 0 : 2,
          wordBreak: "break-word"
        }}
      >
        <Typography 
          variant="body1" 
          sx={{ 
            fontSize: isMobile ? "0.95rem" : "1rem",
            whiteSpace: "pre-wrap"
          }}
        >
          {message.text}
        </Typography>
        <Box 
          sx={{ 
            display: "flex", 
            alignItems: "center",
            justifyContent: isOwn ? "flex-end" : "flex-start",
            mt: 0.5
          }}
        >
          <Tooltip title="Mesaj criptat end-to-end">
            <LockOutlinedIcon 
              sx={{ 
                fontSize: isMobile ? "0.6rem" : "0.7rem", 
                mr: 0.5, 
                opacity: 0.6,
                color: isOwn ? "white" : "text.secondary"
              }} 
            />
          </Tooltip>
          <Typography 
            variant="caption" 
            sx={{ 
              opacity: 0.7,
              fontSize: isMobile ? "0.65rem" : "0.75rem",
              color: isOwn ? "white" : "text.secondary"
            }}
          >
            {formatTime(message.createdAt)}
          </Typography>
        </Box>
      </Paper>
      {isOwn && (
        <Avatar
          src={message.senderPhoto}
          alt={message.senderName}
          sx={{ 
            ml: 1, 
            width: avatarSize, 
            height: avatarSize,
            alignSelf: "flex-end",
            mb: 0.5
          }}
        >
          {message.senderName?.charAt(0) || "U"}
        </Avatar>
      )}
    </Box>
  );
};

export default Message;