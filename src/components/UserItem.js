import React from "react";
import {
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
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
  
  // Status indicator - green dot for online
  const badgeStatus = user.online ? "success" : "default";

  return (
    <>
      <ListItem 
        button 
        onClick={onSelect}
        alignItems="center"
        sx={{ 
          py: 1.5,
          px: 2,
          transition: "all 0.2s",
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
        <ListItemText 
          primary={
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
          }
          secondary={
            <Box component="span" sx={{ display: "flex", alignItems: "center" }}>
              <Typography
                variant="body2"
                color="text.secondary"
                noWrap
                sx={{ fontSize: isMobile ? "0.8rem" : "0.875rem" }}
              >
                {user.online ? "Online" : "Offline"}
              </Typography>
            </Box>
          }
        />
      </ListItem>
      <Divider component="li" />
    </>
  );
};

export default UserItem;