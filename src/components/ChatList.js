import React, { useState, useEffect } from "react";
import { 
  Box, 
  Grid, 
  Drawer, 
  useMediaQuery, 
  useTheme, 
  Paper, 
  Fab,
  Zoom,
  Slide,
  Collapse,
  IconButton,
  Tooltip
} from "@mui/material";
import ChatIcon from "@mui/icons-material/Chat";
import CloseIcon from "@mui/icons-material/Close";
import UserList from "./UserList";
import Chat from "./Chat";
import { useAuth } from "../context/AuthContext";

const ChatList = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showFab, setShowFab] = useState(false);
  const { currentUser } = useAuth();

  // Toggle FAB visibility when mobile drawer is closed
  useEffect(() => {
    if (isMobile) {
      setShowFab(!mobileOpen);
    } else {
      setShowFab(false);
    }
  }, [isMobile, mobileOpen]);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    if (isMobile) {
      setMobileOpen(true);
    }
  };

  const handleBack = () => {
    if (isMobile) {
      setMobileOpen(false);
    } else {
      setSelectedUser(null);
    }
  };

  // Close mobile drawer on escape key
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape" && mobileOpen) {
        handleBack();
      }
    };

    window.addEventListener("keydown", handleEscKey);
    return () => {
      window.removeEventListener("keydown", handleEscKey);
    };
  }, [mobileOpen]);

  // Handle swipe to dismiss on mobile
  const handleSwipe = (direction) => {
    if (direction === "right" && mobileOpen) {
      handleBack();
    }
  };

  if (isMobile) {
    return (
      <Box sx={{ 
        height: "calc(100vh - 64px)", 
        bgcolor: "background.default",
        position: "relative"
      }}>
        <Collapse in={!mobileOpen} timeout={300} mountOnEnter unmountOnExit>
          <Paper 
            elevation={2} 
            sx={{ 
              height: "100%", 
              borderRadius: 0,
              overflow: "hidden"
            }}
          >
            <UserList setSelectedUser={handleSelectUser} />
          </Paper>
        </Collapse>

        <Drawer
          anchor="right"
          open={mobileOpen}
          onClose={handleBack}
          sx={{
            width: "100%",
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: "100%",
              boxSizing: "border-box",
              transition: "transform 0.3s ease-out"
            },
          }}
          SlideProps={{
            direction: "left"
          }}
        >
          {selectedUser && (
            <Slide direction="left" in={mobileOpen} mountOnEnter unmountOnExit>
              <div>
                <Chat 
                  selectedUser={selectedUser} 
                  onBack={handleBack} 
                  onSwipe={handleSwipe}
                />
              </div>
            </Slide>
          )}
        </Drawer>

        {/* Add FAB to quickly return to user list on mobile */}
        <Zoom in={showFab && selectedUser}>
          <Box sx={{ position: "fixed", bottom: 16, right: 16, zIndex: 1000 }}>
            <Tooltip title="Înapoi la lista de utilizatori">
              <Fab
                color="secondary"
                size={isSmall ? "medium" : "large"}
                onClick={handleBack}
                sx={{
                  boxShadow: 4,
                  "&:hover": {
                    transform: "scale(1.05)"
                  }
                }}
              >
                <CloseIcon />
              </Fab>
            </Tooltip>
          </Box>
        </Zoom>
      </Box>
    );
  }

  return (
    <Grid 
      container 
      sx={{ 
        height: "calc(100vh - 64px)",
        overflow: "hidden",
        transition: "all 0.3s ease"
      }} 
      spacing={0}
    >
      <Grid 
        item 
        xs={12} 
        sm={4} 
        md={3} 
        lg={3} 
        sx={{ 
          height: "100%",
          transition: "all 0.3s ease",
          display: "flex",
          flexDirection: "column",
          borderRight: 1,
          borderColor: 'divider'
        }}
      >
        <Paper 
          elevation={2} 
          sx={{ 
            height: "100%", 
            borderRadius: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden"
          }}
        >
          <UserList setSelectedUser={setSelectedUser} />
        </Paper>
      </Grid>
      <Grid 
        item 
        xs={12} 
        sm={8} 
        md={9} 
        lg={9} 
        sx={{ 
          height: "100%",
          transition: "all 0.3s ease"
        }}
      >
        {selectedUser ? (
          <Slide direction="left" in={!!selectedUser} mountOnEnter unmountOnExit>
            <div style={{ height: '100%' }}>
              <Chat selectedUser={selectedUser} onBack={handleBack} />
            </div>
          </Slide>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
              bgcolor: "background.default",
              p: 3
            }}
          >
            <ChatIcon 
              sx={{ 
                fontSize: 60, 
                color: 'primary.main', 
                opacity: 0.7,
                mb: 2
              }} 
            />
            <Zoom in={true} style={{ transitionDelay: '250ms' }}>
              <Box sx={{ textAlign: 'center' }}>
                <Box 
                  sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    bgcolor: 'background.paper',
                    boxShadow: 1,
                    maxWidth: 400,
                    mx: 'auto'
                  }}
                >
                  Selectează un utilizator din lista din stânga pentru a începe o conversație
                </Box>
              </Box>
            </Zoom>
          </Box>
        )}
      </Grid>
    </Grid>
  );
};

export default ChatList;