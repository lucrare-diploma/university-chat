import React from "react";
import {
  ListItem,
  ListItemAvatar,
  Avatar,
  Divider,
  Typography,
  Badge,
  Box,
  useTheme,
  useMediaQuery
} from "@mui/material";

const UserItem = ({ user, onSelect }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  
  // Verificăm dacă user există pentru a evita erorile
  if (!user) {
    return null;
  }
  
  // Status indicator - green dot for online
  const badgeStatus = user.online ? "success" : "default";

  return (
    <>
      <ListItem 
        // Folosim component="button" în loc de button prop
        component="button"
        onClick={() => onSelect(user)}
        alignItems="center"
        sx={{ 
          py: 1.5,
          px: 2,
          transition: "all 0.2s",
          width: '100%',
          textAlign: 'left',
          border: 'none',
          backgroundColor: 'transparent',
          cursor: 'pointer',
          "&:hover": {
            backgroundColor: "action.hover",
          }
        }}
      >
        <ListItemAvatar>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            variant="dot"
            color={badgeStatus}
          >
            <Avatar 
              src={user.photoURL} 
              alt={user.displayName}
              sx={{ 
                width: isMobile ? 40 : 48, 
                height: isMobile ? 40 : 48,
                boxShadow: 1
              }}
            >
              {user.displayName?.charAt(0) || "U"}
            </Avatar>
          </Badge>
        </ListItemAvatar>
        
        <Box sx={{ ml: 1.5, flex: 1, minWidth: 0 }}>
          <Typography 
            variant="body1" 
            noWrap 
            sx={{ 
              fontWeight: 500,
              fontSize: isMobile ? "0.95rem" : "1rem"
            }}
          >
            {user.displayName || "Utilizator"}
          </Typography>
          
          <Typography
            variant="body2"
            component="span"
            color="text.secondary"
            noWrap
            sx={{ 
              fontSize: isMobile ? "0.8rem" : "0.875rem",
              display: "block"
            }}
          >
            {user.online ? "Online" : "Offline"}
          </Typography>
        </Box>
      </ListItem>
      <Divider component="li" />
    </>
  );
};

export default UserItem;