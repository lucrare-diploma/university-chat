import React, { useState } from "react";
import { Box, Typography, Avatar, Paper, Tooltip, Menu, MenuItem, IconButton, Fade, ListItemIcon, alpha, Zoom } from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ReplyIcon from "@mui/icons-material/Reply";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import ScheduleIcon from "@mui/icons-material/Schedule";
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

  const avatarSize = isMobile ? 28 : 32;
  const maxWidth = isMobile ? "70%" : "65%";
  
  // Adjust margins for grouped messages
  const marginTop = isGroupedWithPrev ? 0.5 : 1.5;
  
  // Determine if we should show the message status
  const messageStatus = isOwn ? (
    message.delivered ? (
      <DoneAllIcon 
        sx={{ 
          fontSize: isMobile ? "0.7rem" : "0.8rem",
          color: message.read ? "primary.main" : "inherit",
          opacity: 0.7
        }}
      />
    ) : (
      <ScheduleIcon 
        sx={{ 
          fontSize: isMobile ? "0.7rem" : "0.8rem", 
          opacity: 0.7
        }}
      />
    )
  ) : null;

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: isOwn ? "flex-end" : "flex-start",
        mb: isGroupedWithNext ? 0.5 : 1.5,
        mt: marginTop,
        px: 0.5,
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
                mr: 1, 
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
            <Box sx={{ width: avatarSize + 8, mr: 1 }} /> // Placeholder for avatar spacing
          )}
        </>
      )}
      
      <Box sx={{ maxWidth: maxWidth, position: "relative" }}>
        <Zoom in={true} style={{ transitionDelay: '50ms' }}>
          <Paper
            elevation={isOwn ? 0 : 1}
            sx={{
              p: isMobile ? 1.5 : 2,
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
                fontSize: isMobile ? "0.95rem" : "1rem",
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
                width: 24,
                height: 24,
                transition: "opacity 0.2s ease",
                "&:hover": {
                  backgroundColor: theme.palette.action.hover
                }
              }}
            >
              <MoreVertIcon fontSize="small" sx={{ fontSize: "1rem" }} />
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
                  color: isOwn ? "white" : "text.secondary",
                  display: "flex",
                  alignItems: "center"
                }}
              >
                {formatTime(message.createdAt)}
                {messageStatus && (
                  <Box component="span" sx={{ ml: 0.5, display: "flex", alignItems: "center" }}>
                    {messageStatus}
                  </Box>
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
                ml: 1, 
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
            <Box sx={{ width: avatarSize + 8, ml: 1 }} /> // Placeholder for avatar spacing
          )}
        </>
      )}
    </Box>
  );
};

export default Message;