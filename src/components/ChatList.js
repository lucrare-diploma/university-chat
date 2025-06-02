// src/components/ChatList.js - Versiune actualizată cu suport pentru grupuri
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
  IconButton,
  Tabs,
  Tab,
  Badge,
  Typography
} from "@mui/material";
import ChatIcon from "@mui/icons-material/Chat";
import CloseIcon from "@mui/icons-material/Close";
import MenuIcon from "@mui/icons-material/Menu";
import GroupIcon from "@mui/icons-material/Group";
import PersonIcon from "@mui/icons-material/Person";
import UserList from "./UserList";
import GroupList from "./GroupList"; // Componenta nouă pe care o vom crea
import Chat from "./Chat";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from 'react-router-dom';

// Componenta pentru tab-uri personalizate cu iconițe și contoare
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`chat-tabpanel-${index}`}
      aria-labelledby={`chat-tab-${index}`}
      {...other}
      style={{ height: '100%' }}
    >
      {value === index && (
        <Box sx={{ height: '100%' }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ChatList = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0); // 0 = utilizatori, 1 = grupuri
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showFab, setShowFab] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // State pentru contoarele de pe tab-uri (opțional, pentru a arăta câte conversații/grupuri sunt)
  const [userCount, setUserCount] = useState(0);
  const [groupCount, setGroupCount] = useState(0);

  // Toggle FAB visibility
  useEffect(() => {
    if (isMobile) {
      setShowFab(!sidebarOpen && selectedUser);
    } else {
      setShowFab(false);
    }
  }, [isMobile, sidebarOpen, selectedUser]);

  const handleSelectUser = (user) => {
      // console.log("Utilizator/grup selectat:", user);
      // setSelectedUser(user);
      // setSidebarOpen(false);
    console.log("Utilizator/grup selectat:", user);
    
    if (user.type === 'group') {
      // Navigare către grup
      navigate(`/group/${user.id}`);
    } else {
      // Navigare către chat individual
      navigate(`/chat/${user.id}`);
    }
    
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

  // Funcție pentru a schimba tab-ul
  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
    // Când schimbăm tab-ul, resetăm selecția
    setSelectedUser(null);
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
      {/* Drawer pentru lista de conversații */}
      <Drawer
        anchor="left"
        open={sidebarOpen}
        onClose={toggleSidebar}
        sx={{
          '& .MuiDrawer-paper': {
            width: isMobile ? '100%' : 350,
            height: '100%',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header cu tab-uri */}
          <Box sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            bgcolor: 'background.paper'
          }}>
            <Tabs 
              value={selectedTab} 
              onChange={handleTabChange}
              variant="fullWidth"
              indicatorColor="primary"
              textColor="primary"
            >
              <Tab 
                icon={<PersonIcon />} 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    Utilizatori
                    {userCount > 0 && (
                      <Badge 
                        badgeContent={userCount} 
                        color="primary" 
                        size="small"
                        sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', minWidth: '16px', height: '16px' } }}
                      />
                    )}
                  </Box>
                }
                iconPosition="start"
                sx={{ 
                  minHeight: 48,
                  textTransform: 'none',
                  fontSize: '0.9rem'
                }}
              />
              <Tab 
                icon={<GroupIcon />} 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    Grupuri
                    {groupCount > 0 && (
                      <Badge 
                        badgeContent={groupCount} 
                        color="secondary" 
                        size="small"
                        sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', minWidth: '16px', height: '16px' } }}
                      />
                    )}
                  </Box>
                }
                iconPosition="start"
                sx={{ 
                  minHeight: 48,
                  textTransform: 'none',
                  fontSize: '0.9rem'
                }}
              />
            </Tabs>
          </Box>

          {/* Conținutul tab-urilor */}
          <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
            <TabPanel value={selectedTab} index={0}>
              <UserList 
                setSelectedUser={handleSelectUser}
                onUserCountChange={setUserCount} // Pentru a actualiza contorul
              />
            </TabPanel>
            <TabPanel value={selectedTab} index={1}>
              <GroupList 
                onSelectGroup={handleSelectUser}
                selectedChat={selectedUser}
                onGroupCountChange={setGroupCount} // Pentru a actualiza contorul
              />
            </TabPanel>
          </Box>
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
                  <Typography variant="h6" gutterBottom>
                    Bine ai venit în USV Chat!
                  </Typography>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    {selectedTab === 0 
                      ? "Selectează un utilizator pentru a începe o conversație privată"
                      : "Creează un grup nou sau alătură-te la unul existent pentru a începe să colaborezi"
                    }
                  </Typography>
                  <Fab
                    color="primary"
                    variant="extended"
                    size="medium"
                    onClick={toggleSidebar}
                  >
                    <MenuIcon sx={{ mr: 1 }} />
                    {selectedTab === 0 ? 'Vezi utilizatorii' : 'Vezi grupurile'}
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
          <Tooltip title="Înapoi la conversații">
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