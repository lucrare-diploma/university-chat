import React, { useState, useEffect } from "react";
import { 
  Box, 
  CssBaseline, 
  AppBar, 
  Toolbar, 
  Typography,
  Avatar, 
  useTheme, 
  useMediaQuery,
  IconButton,
  Menu,
  MenuItem,
  ThemeProvider,
  createTheme,
  ListItemIcon,
  Fab,
  Tooltip,
  Zoom,
  Badge
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import LockIcon from "@mui/icons-material/Lock";
import InfoIcon from "@mui/icons-material/Info";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase/config";
import Auth from "./components/Auth";
import ChatList from "./components/ChatList";

// Back to top button
function ScrollTop(props) {
  const { children } = props;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const trigger = useScrollTriggerFn({
    disableHysteresis: true,
    threshold: 100,
    disabled: isMobile // Pass as a prop instead of conditional hook usage
  });

  const handleClick = (event) => {
    const anchor = document.querySelector('#back-to-top-anchor');
    if (anchor) {
      anchor.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <Zoom in={trigger}>
      <Box
        onClick={handleClick}
        role="presentation"
        sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 99 }}
      >
        {children}
      </Box>
    </Zoom>
  );
}

// Helper function to detect scroll position
function useScrollTriggerFn(options = {}) {
  const { threshold = 100, disableHysteresis = false, disabled = false } = options;
  const [trigger, setTrigger] = useState(false);
  
  useEffect(() => {
    if (disabled) {
      setTrigger(false);
      return;
    }

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (disableHysteresis) {
        setTrigger(currentScrollY > threshold);
      } else {
        if ((trigger && currentScrollY < threshold) || 
            (!trigger && currentScrollY > threshold)) {
          setTrigger(currentScrollY > threshold);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [disableHysteresis, threshold, trigger, disabled]);
  
  return trigger;
}

// Componenta pentru layout-ul când utilizatorul este autentificat
const AuthenticatedLayout = ({ toggleColorMode, mode }) => {
  const { currentUser, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    logout();
  };

  // Salvează informațiile utilizatorului în Firestore
  useEffect(() => {
    const saveUserToFirestore = async () => {
      if (currentUser) {
        try {
          console.log("Salvez utilizatorul în Firestore:", currentUser.uid);
          const userRef = doc(db, "users", currentUser.uid);
          await setDoc(
            userRef,
            {
              displayName: currentUser.displayName || "Utilizator necunoscut",
              email: currentUser.email,
              photoURL: currentUser.photoURL,
              lastActive: serverTimestamp(),
              online: true,
              uid: currentUser.uid
            },
            { merge: true }
          );
  
          console.log("Utilizatorul a fost salvat în Firestore");
        } catch (error) {
          console.error("Eroare la salvarea utilizatorului:", error);
        }
      }
    };
  
    saveUserToFirestore();
    
    return () => {
      // Cleanup code if needed
    };
  }, [currentUser]);

  useEffect(() => {
    const initializeUnreadMessagesDoc = async () => {
      if (currentUser) {
        try {
          // Verificăm dacă documentul pentru mesaje necitite există deja
          const userUnreadCountsRef = doc(db, "userUnreadCounts", currentUser.uid);
          const docSnap = await getDoc(userUnreadCountsRef);
          
          if (!docSnap.exists()) {
            // Dacă nu există, inițializăm un document gol
            await setDoc(userUnreadCountsRef, {});
            console.log("Document de mesaje necitite inițializat pentru utilizator");
          }
        } catch (error) {
          console.error("Eroare la inițializarea documentului de mesaje necitite:", error);
        }
      }
    };
    
    initializeUnreadMessagesDoc();
  }, [currentUser]);

  return (
    <Box 
      sx={{ 
        display: "flex", 
        flexDirection: "column", 
        height: "100vh",
        overflow: "hidden",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        maxHeight: "100vh"
      }}
    >
      <CssBaseline />
      <AppBar 
        position="sticky"
        elevation={1}
        sx={{
          bgcolor: "background.paper",
          color: "text.primary",
          transition: "all 0.3s ease",
          height: isMobile ? '56px' : '64px',
          zIndex: theme.zIndex.drawer + 1
        }}
      >
        <Toolbar 
          sx={{ 
            minHeight: isMobile ? 56 : 64,
            px: isSmallMobile ? 1 : 2,
            gap: 1
          }}
        >
          {isMobile && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={handleMenu}
              sx={{ 
                mr: 1,
                color: 'text.primary'
              }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontSize: isMobile ? "1.1rem" : "1.25rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 1
            }}
          >
            <Badge
              color="primary"
              variant="dot"
              sx={{
                "& .MuiBadge-badge": {
                  right: 3,
                  top: 5
                }
              }}
            >
              <LockIcon 
                fontSize="small" 
                sx={{ 
                  color: 'primary.main',
                  animation: "pulse 2s infinite",
                  "@keyframes pulse": {
                    "0%": {
                      opacity: 0.7,
                    },
                    "50%": {
                      opacity: 1,
                    },
                    "100%": {
                      opacity: 0.7,
                    }
                  }
                }} 
              />
            </Badge>
            USV Chat
          </Typography>
          
          {/* Theme toggle button */}
          <Tooltip title={mode === 'dark' ? "Comută la modul deschis" : "Comută la modul întunecat"}>
            <IconButton 
              color="inherit" 
              onClick={toggleColorMode} 
              sx={{ ml: 1 }}
              size={isMobile ? "small" : "medium"}
            >
              {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>

          {isMobile ? (
            <Avatar 
              src={currentUser?.photoURL} 
              alt={currentUser?.displayName}
              onClick={handleMenu}
              sx={{ 
                cursor: "pointer",
                width: 36,
                height: 36,
                transition: "all 0.2s ease",
                "&:hover": {
                  opacity: 0.8,
                  transform: "scale(1.05)"
                },
                border: 1,
                borderColor: 'divider'
              }}
            >
              {currentUser?.displayName?.charAt(0) || "U"}
            </Avatar>
          ) : (
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Typography 
                variant="body1" 
                sx={{ 
                  mr: 1, 
                  display: { xs: 'none', sm: 'block' } 
                }}
              >
                {currentUser?.displayName}
              </Typography>
              <Avatar 
                src={currentUser?.photoURL} 
                alt={currentUser?.displayName}
                onClick={handleMenu}
                sx={{ 
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    opacity: 0.8,
                    transform: "scale(1.05)"
                  },
                  border: 1,
                  borderColor: 'divider'
                }}
              >
                {currentUser?.displayName?.charAt(0) || "U"}
              </Avatar>
              <IconButton
                aria-label="user account menu"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
                edge="end"
                size="small"
              >
                <MenuIcon />
              </IconButton>
            </Box>
          )}
          
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            keepMounted
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            elevation={3}
            PaperProps={{
              sx: {
                mt: 1.5,
                minWidth: 200,
                boxShadow: theme.shadows[4],
                transition: 'all 0.2s ease'
              }
            }}
          >
            <MenuItem disabled sx={{ opacity: 1 }}>
              <Box sx={{ 
                display: "flex", 
                alignItems: "center", 
                flexDirection: "column",
                width: "100%",
                py: 1
              }}>
                <Avatar
                  src={currentUser?.photoURL}
                  alt={currentUser?.displayName}
                  sx={{ 
                    width: 60,
                    height: 60,
                    mb: 1,
                    boxShadow: theme.shadows[2]
                  }}
                >
                  {currentUser?.displayName?.charAt(0) || "U"}
                </Avatar>
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                  {currentUser?.displayName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {currentUser?.email}
                </Typography>
              </Box>
            </MenuItem>
            
            <MenuItem onClick={handleClose}>
              <ListItemIcon>
                <AccountCircleIcon fontSize="small" />
              </ListItemIcon>
              <Typography variant="body2">Profil</Typography>
            </MenuItem>
            
            <MenuItem onClick={toggleColorMode}>
              <ListItemIcon>
                {mode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
              </ListItemIcon>
              <Typography variant="body2">
                {mode === 'dark' ? "Mod luminos" : "Mod întunecat"}
              </Typography>
            </MenuItem>
            
            <MenuItem onClick={handleClose}>
              <ListItemIcon>
                <InfoIcon fontSize="small" />
              </ListItemIcon>
              <Typography variant="body2">Despre aplicație</Typography>
            </MenuItem>
            
            <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" sx={{ color: 'error.main' }} />
              </ListItemIcon>
              <Typography variant="body2">Deconectare</Typography>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <div id="back-to-top-anchor" />
      
      <Box 
        sx={{ 
          flexGrow: 1, 
          overflow: "hidden",
          height: isMobile ? 'calc(100% - 56px)' : 'calc(100% - 64px)'
        }}
      >
        <ChatList />
      </Box>
      
      <ScrollTop>
        <Fab color="primary" size="medium" aria-label="înapoi sus">
          <KeyboardArrowUpIcon />
        </Fab>
      </ScrollTop>
    </Box>
  );
};

// Componenta principală
const App = () => {
  const [mode, setMode] = useState(() => {
    // Check for saved preference or use system preference
    const savedMode = localStorage.getItem('theme-mode');
    if (savedMode) {
      return savedMode;
    }
    // Check system preference
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches 
      ? 'dark' 
      : 'light';
  });

  // Toggle between light and dark modes
  const toggleColorMode = () => {
    setMode((prevMode) => {
      const newMode = prevMode === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme-mode', newMode);
      return newMode;
    });
  };

  // Create theme based on current mode
  const theme = createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'dark' ? '#7986cb' : '#3f51b5',
        light: mode === 'dark' ? '#9fa8da' : '#757de8',
        dark: mode === 'dark' ? '#5c6bc0' : '#002984',
      },
      secondary: {
        main: mode === 'dark' ? '#ff4081' : '#f50057',
        light: mode === 'dark' ? '#ff79b0' : '#ff5983',
        dark: mode === 'dark' ? '#c60055' : '#bb002f',
      },
      background: {
        default: mode === 'dark' ? '#121212' : '#f5f5f5',
        paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
      },
      text: {
        primary: mode === 'dark' ? '#e0e0e0' : '#121212',
        secondary: mode === 'dark' ? '#a0a0a0' : '#666666',
      }
    },
    typography: {
      fontFamily: [
        'Roboto',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ].join(','),
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            transition: 'all 0.3s ease',
          },
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          'html, body': {
            overflow: 'hidden',
            height: '100%',
            width: '100%',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            WebkitOverflowScrolling: 'touch',
          },
          body: {
            scrollbarWidth: 'thin',
            '&::-webkit-scrollbar': {
              width: '8px',
              height: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: mode === 'dark' ? '#2d2d2d' : '#f1f1f1',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: mode === 'dark' ? '#555' : '#888',
              borderRadius: '4px',
              '&:hover': {
                background: mode === 'dark' ? '#777' : '#555',
              },
            },
            '@media (max-width: 600px)': {
              '&::-webkit-scrollbar': {
                width: '4px',
                height: '4px',
              },
            }
          },
          '#root': {
            height: '100%',
            overflow: 'hidden',
            position: 'fixed',
            width: '100%'
          }
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            '@media (max-width: 600px)': {
              height: 'calc(100% - 56px)',
            },
          }
        }
      },
      MuiToolbar: {
        styleOverrides: {
          root: {
            '@media (max-width: 600px)': {
              minHeight: '56px',
              paddingLeft: '8px',
              paddingRight: '8px'
            },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            transition: 'all 0.2s ease',
            '@media (max-width: 600px)': {
              padding: '8px',
            },
          },
        },
      },
      MuiAvatar: {
        styleOverrides: {
          root: {
            boxShadow: mode === 'dark' 
              ? '0 0 0 1px rgba(255,255,255,0.12)' 
              : '0 0 0 1px rgba(0,0,0,0.12)',
          },
        },
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <AppContent toggleColorMode={toggleColorMode} mode={mode} />
      </AuthProvider>
    </ThemeProvider>
  );
};

// Conținut bazat pe starea autentificării
const AppContent = ({ toggleColorMode, mode }) => {
  const { currentUser } = useAuth();

  return currentUser ? (
    <AuthenticatedLayout toggleColorMode={toggleColorMode} mode={mode} />
  ) : (
    <Auth toggleColorMode={toggleColorMode} mode={mode} />
  );
};

export default App;