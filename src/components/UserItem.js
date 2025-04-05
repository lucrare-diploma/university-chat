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
  useMediaQuery,
  Tooltip,
  alpha,
  Zoom
} from "@mui/material";
import MessageIcon from "@mui/icons-material/Message";
import EmailIcon from "@mui/icons-material/Email";

const UserItem = ({ user, onSelect }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  
  // Verificăm dacă user există pentru a evita erorile
  if (!user) {
    return null;
  }
  
  // Status indicator - green dot for online
  const badgeStatus = user.online ? "success" : "default";
  const statusText = user.online ? "Online" : "Offline";

  // Format time since last active
  const formatLastActive = () => {
    if (!user.lastActive) return "";
    
    try {
      // If the lastActive field is a Firebase timestamp, convert it to a JS Date
      const lastActiveDate = user.lastActive.toDate ? user.lastActive.toDate() : new Date(user.lastActive);
      const now = new Date();
      const diffMs = now - lastActiveDate;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (user.online) return "Activ acum";
      if (diffMins < 1) return "Activ recent";
      if (diffMins < 60) return `Activ ${diffMins} minute în urmă`;
      if (diffHours < 24) return `Activ ${diffHours} ore în urmă`;
      return `Activ ${diffDays} zile în urmă`;
    } catch (error) {
      console.error("Error formatting last active time:", error);
      return "";
    }
  };

  return (
    <Zoom in={true} style={{ transitionDelay: '100ms' }}>
      <div>
        <ListItem 
          component="button"
          onClick={() => onSelect(user)}
          alignItems="center"
          sx={{ 
            py: 1.5,
            px: 2,
            transition: "all 0.2s ease-in-out",
            width: '100%',
            textAlign: 'left',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
            "&:hover": {
              backgroundColor: alpha(theme.palette.primary.main, 0.08),
              transform: "translateY(-2px)",
              boxShadow: "0 4px 10px rgba(0,0,0,0.05)"
            },
            "&:hover .message-icon": {
              opacity: 1,
              transform: "translateX(0)",
            },
            "&:active": {
              backgroundColor: alpha(theme.palette.primary.main, 0.15),
              transform: "translateY(0)",
            }
          }}
        >
          <ListItemAvatar>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              variant="dot"
              color={badgeStatus}
              sx={{
                "& .MuiBadge-badge": {
                  boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  transition: "all 0.2s"
                }
              }}
            >
              <Avatar 
                src={user.photoURL} 
                alt={user.displayName}
                sx={{ 
                  width: isMobile ? 40 : 48, 
                  height: isMobile ? 40 : 48,
                  boxShadow: `0 0 0 1px ${alpha(theme.palette.divider, 0.1)}`,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    transform: "scale(1.05)"
                  }
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
                display: "flex",
                alignItems: "center",
                opacity: 0.8,
                mt: 0.25
              }}
            >
              {user.online && (
                <Box 
                  component="span" 
                  sx={{ 
                    display: "inline-block",
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: "success.main",
                    mr: 0.8,
                    animation: "pulse 2s infinite",
                    "@keyframes pulse": {
                      "0%": {
                        boxShadow: "0 0 0 0 rgba(76, 175, 80, 0.4)"
                      },
                      "70%": {
                        boxShadow: "0 0 0 6px rgba(76, 175, 80, 0)"
                      },
                      "100%": {
                        boxShadow: "0 0 0 0 rgba(76, 175, 80, 0)"
                      }
                    }
                  }} 
                />
              )}
              {formatLastActive()}
            </Typography>

            {user.unreadCount > 0 && (
              <Box 
                sx={{
                  position: "absolute",
                  top: "50%",
                  right: 35,
                  transform: "translateY(-50%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 20,
                    height: 20,
                    borderRadius: 10,
                    bgcolor: "primary.main",
                    color: "white",
                    fontSize: "0.75rem",
                    fontWeight: "bold",
                    px: 0.8
                  }}
                >
                  {user.unreadCount}
                </Box>
              </Box>
            )}
          </Box>

          {/* Message icon that appears on hover */}
          <Box
            className="message-icon"
            sx={{
              opacity: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.palette.primary.main,
              transform: "translateX(10px)",
              transition: "all 0.2s ease-in-out",
              mr: 0.5
            }}
          >
            <Tooltip title="Trimite mesaj">
              <MessageIcon fontSize={isMobile ? "small" : "medium"} />
            </Tooltip>
          </Box>

          {/* Show email icon if email is verified */}
          {user.emailVerified && (
            <Tooltip title="Email verificat">
              <EmailIcon 
                fontSize="small" 
                color="success" 
                sx={{ 
                  position: "absolute", 
                  bottom: 12, 
                  right: 12, 
                  fontSize: "0.9rem",
                  opacity: 0.7
                }} 
              />
            </Tooltip>
          )}
        </ListItem>
        <Divider 
          component="li" 
          sx={{ 
            opacity: 0.6,
            borderColor: alpha(theme.palette.divider, 0.5)
          }}
        />
      </div>
    </Zoom>
  );
};

export default UserItem;