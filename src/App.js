import React, { useEffect } from "react";
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
  createTheme
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase/config";
import Auth from "./components/Auth";
import ChatList from "./components/ChatList";
import { ref, onDisconnect, getDatabase } from "firebase/database";
import { useState } from "react";

// Componenta pentru layout-ul când utilizatorul este autentificat
const AuthenticatedLayout = () => {
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
    
    // Eliminăm codul de actualizare a statusului de aici,
    // deoarece acum este gestionat în funcția logout
    return () => {
      // Aici poate rămâne orice alt cleanup necesar, dar fără actualizarea statusului
    };
  }, [currentUser]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <CssBaseline />
      <AppBar 
        position="static"
        elevation={1}
        sx={{
          bgcolor: "background.paper",
          color: "text.primary"
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
              fontSize: isMobile ? "1.1rem" : "1.25rem"
            }}
          >
            Chat App
          </Typography>
          {isMobile ? (
            <>
              <Avatar 
                src={currentUser?.photoURL} 
                alt={currentUser?.displayName}
                onClick={handleMenu}
                sx={{ 
                  cursor: "pointer",
                  width: 36,
                  height: 36
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
                sx={{ mr: 2 }}
              >
                {currentUser?.displayName?.charAt(0) || "U"}
              </Avatar>
              <Button 
                color="primary" 
                onClick={logout}
                variant="outlined"
                startIcon={<LogoutIcon />}
                size="small"
              >
                Deconectare
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      <ChatList />
    </Box>
  );
};

// Create a custom theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#3f51b5',
      light: '#757de8',
      dark: '#002984',
    },
    secondary: {
      main: '#f50057',
      light: '#ff5983',
      dark: '#bb002f',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
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
  },
});

// Componenta principală
const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

// Conținut bazat pe starea autentificării
const AppContent = () => {
  const { currentUser } = useAuth();

  return currentUser ? <AuthenticatedLayout /> : <Auth />;
};

export default App;