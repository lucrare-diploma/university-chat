import React, { useState } from "react";
import { Box, Typography, Avatar, Paper, Tooltip, Menu, MenuItem, IconButton, ListItemIcon, alpha, Zoom } from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ReplyIcon from "@mui/icons-material/Reply";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import DoneIcon from "@mui/icons-material/Done";
import { useTheme } from "@mui/material/styles";

const Message = ({ 
  message, 
  isOwn, 
  isMobile, 
  isGroupedWithPrev = false,
  isGroupedWithNext = false,
  showAvatar = true,
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const [copied, setCopied] = useState(false);
  
  // Message menu handlers
  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    handleMenuClose();
  };

  // Formatarea datei și orei pentru mesaje
  const formatTime = (date) => {
    if (!date) return "";
    
    try {
      // Verifică dacă este un obiect Date valid
      const messageDate = date instanceof Date ? date : new Date(date);
      
      if (isNaN(messageDate.getTime())) {
        return ""; 
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

  // Format date for full timestamp
  const formatFullDate = (date) => {
    if (!date) return "";
    
    try {
      const messageDate = date instanceof Date ? date : new Date(date);
      
      if (isNaN(messageDate.getTime())) {
        return "";
      }
      
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const isToday = messageDate.setHours(0,0,0,0) === today.setHours(0,0,0,0);
      const isYesterday = messageDate.setHours(0,0,0,0) === yesterday.setHours(0,0,0,0);
      
      let formattedDate;
      
      if (isToday) {
        formattedDate = "Astăzi";
      } else if (isYesterday) {
        formattedDate = "Ieri";
      } else {
        formattedDate = messageDate.toLocaleDateString([], {
          day: "numeric",
          month: "short",
          year: "numeric"
        });
      }
      
      const time = messageDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      });
      
      return `${formattedDate} la ${time}`;
    } catch (error) {
      console.error("Eroare la formatarea datei complete:", error);
      return "";
    }
  };

  // Ajustăm dimensiunile în funcție de dimensiunea ecranului
  const avatarSize = isMobile ? 28 : 32;
  // Modificăm lățimea maximă pentru a ocupa mai mult spațiu pe ecrane mici
  const maxWidth = isMobile ? "80%" : "65%";
  
  // Ajustăm marginile pentru mesajele grupate
  const marginTop = isGroupedWithPrev ? 0.5 : 1.5;
  const marginBottom = isGroupedWithNext ? 0.5 : 1.5;
  
  // Determine if we should show the message status
  const messageStatus = isOwn ? (
    message.delivered ? (
      message.read ? (
        <DoneAllIcon 
          sx={{ 
            fontSize: isMobile ? "0.7rem" : "0.8rem",
            color: '#66ff00',
            opacity: 0.8
          }}
        />
      ) : (
        <DoneAllIcon 
          sx={{ 
            fontSize: isMobile ? "0.7rem" : "0.8rem", 
            opacity: 0.7
          }}
        />
      )
    ) : (
      <DoneIcon 
        sx={{ 
          fontSize: isMobile ? "0.7rem" : "0.8rem", 
          opacity: 0.7
        }}
      />
    )
  ) : null;

  // Tooltip text for message status
  const getStatusText = () => {
    if (!isOwn) return "";
    
    if (message.delivered) {
      return message.read ? 
        (message.readAt ? `Citit la ${formatFullDate(message.readAt.toDate ? message.readAt.toDate() : message.readAt)}` : "Citit") : 
        "Livrat";
    }
    
    return "Trimis";
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: isOwn ? "flex-end" : "flex-start",
        mb: marginBottom,
        mt: marginTop,
        px: isMobile ? 0.25 : 0.5, // Ajustare pentru ecrane mici
        position: "relative"
      }}
    >
      {!isOwn && (
        <>
          {showAvatar ? (
            <Avatar
              src={message.senderPhoto}
              alt={message.senderName}
              sx={{ 
                mr: isMobile ? 0.5 : 1, // Ajustare pentru ecrane mici
                width: avatarSize, 
                height: avatarSize,
                alignSelf: isGroupedWithPrev ? "center" : "flex-end",
                mb: 0.5,
                opacity: 1,
                transition: "all 0.2s ease"
              }}
            >
              {message.senderName?.charAt(0) || "U"}
            </Avatar>
          ) : (
            <Box sx={{ width: avatarSize + 8, mr: isMobile ? 0.5 : 1 }} /> // Placeholder for avatar spacing
          )}
        </>
      )}
      
      <Box sx={{ maxWidth: maxWidth, position: "relative" }}>
        <Zoom in={true} style={{ transitionDelay: '50ms' }}>
          <Paper
            elevation={isOwn ? 0 : 1}
            sx={{
              p: isMobile ? 1 : 2, // Ajustare padding pentru ecrane mici
              backgroundColor: isOwn 
                ? theme.palette.mode === 'dark' 
                  ? alpha(theme.palette.primary.dark, 0.8)
                  : alpha(theme.palette.primary.main, 0.9)
                : theme.palette.mode === 'dark'
                  ? alpha(theme.palette.background.paper, 0.8)
                  : alpha(theme.palette.background.paper, 0.9),
              color: isOwn ? "white" : "inherit",
              borderRadius: 2.5,
              borderTopRightRadius: isOwn && !isGroupedWithPrev ? 0 : 2.5,
              borderTopLeftRadius: !isOwn && !isGroupedWithPrev ? 0 : 2.5,
              borderBottomRightRadius: isOwn && !isGroupedWithNext ? 0 : 2.5,
              borderBottomLeftRadius: !isOwn && !isGroupedWithNext ? 0 : 2.5,
              wordBreak: "break-word",
              position: "relative",
              "&:hover .message-menu-button": {
                opacity: 1,
              }
            }}
          >
            <Typography 
              variant="body1" 
              sx={{ 
                fontSize: isMobile ? "0.9rem" : "1rem", // Dimensiune font mai mică pe mobile
                whiteSpace: "pre-wrap",
                lineHeight: 1.4
              }}
            >
              {message.text}
            </Typography>

            {/* Message menu button that appears on hover */}
            <IconButton
              size="small"
              onClick={handleMenuOpen}
              className="message-menu-button"
              sx={{
                position: "absolute",
                top: -14,
                right: isOwn ? 0 : "auto",
                left: isOwn ? "auto" : 0,
                opacity: 0,
                backgroundColor: theme.palette.background.paper,
                boxShadow: 1,
                width: isMobile ? 20 : 24, // Ajustare pentru ecrane mici
                height: isMobile ? 20 : 24,
                transition: "opacity 0.2s ease",
                "&:hover": {
                  backgroundColor: theme.palette.action.hover
                }
              }}
            >
              <MoreVertIcon fontSize="small" sx={{ fontSize: isMobile ? "0.8rem" : "1rem" }} />
            </IconButton>
            
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
                    fontSize: isMobile ? "0.5rem" : "0.7rem", // Dimensiune mai mică pe mobile
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
                  fontSize: isMobile ? "0.6rem" : "0.75rem", // Dimensiune mai mică pe mobile
                  color: isOwn ? "white" : "text.secondary",
                  display: "flex",
                  alignItems: "center"
                }}
              >
                {formatTime(message.createdAt)}
                {messageStatus && (
                  <Tooltip title={getStatusText()}>
                    <Box component="span" sx={{ ml: 0.5, display: "flex", alignItems: "center" }}>
                      {messageStatus}
                    </Box>
                  </Tooltip>
                )}
              </Typography>
            </Box>
          </Paper>
        </Zoom>

        {/* Message options menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: "top",
            horizontal: isOwn ? "left" : "right",
          }}
          transformOrigin={{
            vertical: "bottom",
            horizontal: isOwn ? "right" : "left",
          }}
        >
          <MenuItem onClick={handleCopyMessage}>
            <ListItemIcon>
              {copied ? <DoneAllIcon fontSize="small" color="success" /> : <ContentCopyIcon fontSize="small" />}
            </ListItemIcon>
            <Typography variant="body2">{copied ? "Copiat!" : "Copiază mesajul"}</Typography>
          </MenuItem>
          <MenuItem>
            <ListItemIcon>
              <ReplyIcon fontSize="small" />
            </ListItemIcon>
            <Typography variant="body2">Răspunde</Typography>
          </MenuItem>
          {isOwn && (
            <MenuItem sx={{ color: "error.main" }}>
              <ListItemIcon>
                <DeleteOutlineIcon fontSize="small" color="error" />
              </ListItemIcon>
              <Typography variant="body2">Șterge mesajul</Typography>
            </MenuItem>
          )}
        </Menu>

        {/* Tooltip showing full timestamp on hover */}
        <Tooltip
          title={formatFullDate(message.createdAt)}
          placement="top"
          arrow
        >
          <Box 
            sx={{ 
              position: "absolute", 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0,
              cursor: "default"
            }}
          />
        </Tooltip>
      </Box>
      
      {isOwn && (
        <>
          {showAvatar ? (
            <Avatar
              src={message.senderPhoto}
              alt={message.senderName}
              sx={{ 
                ml: isMobile ? 0.5 : 1, // Ajustare pentru ecrane mici
                width: avatarSize, 
                height: avatarSize,
                alignSelf: isGroupedWithPrev ? "center" : "flex-end",
                mb: 0.5,
                opacity: 1,
                transition: "all 0.2s ease"
              }}
            >
              {message.senderName?.charAt(0) || "U"}
            </Avatar>
          ) : (
            <Box sx={{ width: avatarSize + 8, ml: isMobile ? 0.5 : 1 }} /> // Placeholder pentru spațierea avatarului
          )}
        </>
      )}
    </Box>
  );
};

export default Message;