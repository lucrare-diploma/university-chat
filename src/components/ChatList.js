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
  Tooltip,
  IconButton
} from "@mui/material";
import ChatIcon from "@mui/icons-material/Chat";
import CloseIcon from "@mui/icons-material/Close";
import MenuIcon from "@mui/icons-material/Menu";
import UserList from "./UserList";
import Chat from "./Chat";
import { useAuth } from "../context/AuthContext";

const ChatList = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showFab, setShowFab] = useState(false);
  const { currentUser } = useAuth();

  // Toggle FAB visibility
  useEffect(() => {
    if (isMobile) {
      setShowFab(!sidebarOpen && selectedUser);
    } else {
      setShowFab(false);
    }
  }, [isMobile, sidebarOpen, selectedUser]);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setSidebarOpen(false);
  };

  const handleBack = () => {
    if (isMobile) {
      setSidebarOpen(true);
      setSelectedUser(null);
    } else {
      // Pe desktop, doar deschide sidebar-ul
      setSidebarOpen(true);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape" && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscKey);
    return () => {
      window.removeEventListener("keydown", handleEscKey);
    };
  }, [sidebarOpen]);

  // Handle swipe to dismiss on mobile
  const handleSwipe = (direction) => {
    if (direction === "right") {
      // Swipe right deschide sidebar-ul
      setSidebarOpen(true);
    }
  };

  // Componentă pentru butonul de meniu (pentru a deschide lista de conversații)
  const MenuButton = () => (
    <IconButton
      onClick={toggleSidebar}
      sx={{
        position: 'absolute',
        left: 10,
        top: 10,
        zIndex: 1200,
        bgcolor: 'background.paper',
        boxShadow: 2,
        '&:hover': {
          bgcolor: 'background.paper',
          opacity: 0.9
        }
      }}
    >
      <MenuIcon />
    </IconButton>
  );

  return (
    <Box sx={{ 
      height: isMobile ? "calc(100vh - 56px)" : "calc(100vh - 64px)",
      bgcolor: "background.default",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Drawer pentru lista de conversații (afișat când este deschis) */}
      <Drawer
        anchor="left"
        open={sidebarOpen}
        onClose={toggleSidebar}
        sx={{
          '& .MuiDrawer-paper': {
            width: isMobile ? '100%' : 350,
            height: '100%',
            boxSizing: 'border-box',
          },
        }}
      >
        <Box sx={{ height: '100%' }}>
          <UserList setSelectedUser={handleSelectUser} />
        </Box>
      </Drawer>

      {/* Conținutul principal - mereu vizibil */}
      <Box 
        sx={{ 
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Afișează chat-ul dacă există un utilizator selectat */}
        {selectedUser ? (
          <Chat 
            selectedUser={selectedUser} 
            onBack={handleBack}
            onSwipe={handleSwipe}
          />
        ) : (
          // Ecran de start când nu e selectat niciun chat
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
              bgcolor: "background.paper",
              p: 3,
              textAlign: 'center'
            }}
          >
            <ChatIcon 
              sx={{ 
                fontSize: 80, 
                color: 'primary.main', 
                opacity: 0.7,
                mb: 2
              }} 
            />
            <Zoom in={true} style={{ transitionDelay: '250ms' }}>
              <Box sx={{ maxWidth: 400 }}>
                <Paper
                  elevation={3}
                  sx={{ 
                    p: 3, 
                    borderRadius: 2,
                    bgcolor: 'background.default',
                    boxShadow: 3,
                  }}
                >
                  <Box sx={{ mb: 2 }}>
                    Selectează o conversație pentru a începe
                  </Box>
                  <Fab
                    color="primary"
                    variant="extended"
                    size="medium"
                    onClick={toggleSidebar}
                  >
                    <MenuIcon sx={{ mr: 1 }} />
                    Deschide conversațiile
                  </Fab>
                </Paper>
              </Box>
            </Zoom>
          </Box>
        )}
      </Box>

      {/* Buton de meniu - apare doar când sidebar-ul este închis și avem un chat deschis */}
      {!sidebarOpen && selectedUser && !isMobile && <MenuButton />}

      {/* FAB pentru a reveni la lista de utilizatori (pe mobil) */}
      <Zoom in={showFab}>
        <Box sx={{ position: "fixed", bottom: 16, right: 16, zIndex: 1000 }}>
          <Tooltip title="Înapoi la lista de utilizatori">
            <Fab
              color="primary"
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
};

export default ChatList;