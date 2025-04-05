import React, { useEffect, useState } from "react";
import { 
  Box, 
  CssBaseline, 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Avatar, 
  useTheme, 
  useMediaQuery,
  IconButton,
  Menu,
  MenuItem,
  ThemeProvider,
  createTheme,
  Slide,
  useScrollTrigger,
  Zoom,
  Fab,
  Tooltip,
  Switch,
  FormControlLabel
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase/config";
import Auth from "./components/Auth";
import ChatList from "./components/ChatList";
import { ref, onDisconnect, getDatabase } from "firebase/database";

// Component to hide AppBar on scroll down
function HideOnScroll(props) {
  const { children } = props;
  const trigger = useScrollTrigger();

  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}

// Back to top button
function ScrollTop(props) {
  const { children } = props;
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 100,
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

// Componenta pentru layout-ul când utilizatorul este autentificat
const AuthenticatedLayout = ({ toggleColorMode, mode }) => {
  const { currentUser, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
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
  
          const unsubscribePresence = onDisconnect(
            ref(getDatabase(), `status/${currentUser.uid}`)
          ).set("offline");
  
          console.log("Utilizatorul a fost salvat în Firestore");
        } catch (error) {
          console.error("Eroare la salvarea utilizatorului:", error);
        }
      }
    };
  
    saveUserToFirestore();
    
    return () => {
      // Aici poate rămâne orice alt cleanup necesar
    };
  }, [currentUser]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <CssBaseline />
      <HideOnScroll>
        <AppBar 
          position="sticky"
          elevation={1}
          sx={{
            bgcolor: "background.paper",
            color: "text.primary",
            transition: "all 0.3s ease"
          }}
        >
          <Toolbar sx={{ minHeight: isMobile ? 56 : 64 }}>
            {isMobile && (
              <IconButton
                edge="start"
                color="inherit"
                aria-label="menu"
                onClick={handleMenu}
                sx={{ mr: 2 }}
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
                fontWeight: 600
              }}
            >
              USV Chat
            </Typography>
            
            {/* Theme toggle button */}
            <Tooltip title={mode === 'dark' ? "Comută la modul deschis" : "Comută la modul întunecat"}>
              <IconButton 
                color="inherit" 
                onClick={toggleColorMode} 
                sx={{ mr: 1 }}
              >
                {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>

            {isMobile ? (
              <>
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
                    }
                  }}
                >
                  {currentUser?.displayName?.charAt(0) || "U"}
                </Avatar>
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
                >
                  <MenuItem disabled sx={{ opacity: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {currentUser?.displayName}
                    </Typography>
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>
                    <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
                    Deconectare
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Typography variant="body1" sx={{ mr: 2 }}>
                  {currentUser?.displayName}
                </Typography>
                <Avatar 
                  src={currentUser?.photoURL} 
                  alt={currentUser?.displayName}
                  sx={{ 
                    mr: 2,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      opacity: 0.8,
                      transform: "scale(1.05)"
                    }
                  }}
                >
                  {currentUser?.displayName?.charAt(0) || "U"}
                </Avatar>
                <Button 
                  color="primary" 
                  onClick={logout}
                  variant="outlined"
                  startIcon={<LogoutIcon />}
                  size="small"
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                    }
                  }}
                >
                  Deconectare
                </Button>
              </Box>
            )}
          </Toolbar>
        </AppBar>
      </HideOnScroll>
      <div id="back-to-top-anchor" />
      <ChatList />
      
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