import React, { useState, useEffect } from "react";
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  useTheme, 
  useMediaQuery,
  Container,
  Avatar,
  IconButton,
  Tooltip,
  Zoom,
  Collapse,
  Alert,
  Link
} from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import ChatIcon from "@mui/icons-material/Chat";
import LockIcon from "@mui/icons-material/Lock";
import SecurityIcon from "@mui/icons-material/Security";
import InfoIcon from "@mui/icons-material/Info";
import { useAuth } from "../context/AuthContext";
import logo from "../logo.svg";
import { isAllowedEmail } from "../utils/accessControl";
import { useNavigate, useLocation } from 'react-router-dom';


const Auth = ({ initialError }) => {
  const { signInWithGoogle, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError || "");
  const [showSecurityInfo, setShowSecurityInfo] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (initialError) {
      setError(initialError);
    }
  }, [initialError]);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Autentificare cu Google
      const result = await signInWithGoogle();
      
      // Verificăm dacă emailul aparține domeniilor permise
      if (result && result.user && result.user.email) {
        const email = result.user.email.toLowerCase();
        
        if (!isAllowedEmail(email)) {
          // Deconectăm utilizatorul și afișăm eroare
          await logout();
          setError("Acces permis doar pentru adrese de email din domeniile usv.ro sau usm.ro.");
        } else {
          // Navigăm către pagina dorită sau home
          const from = location.state?.from?.pathname || '/university-chat';
          navigate(from, { replace: true });
        }
      }
    } catch (error) {
      console.error("Eroare la autentificare:", error);
      setError("Nu s-a putut realiza conectarea. Vă rugăm încercați din nou.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSecurityInfo = () => {
    setShowSecurityInfo(prev => !prev);
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: theme.palette.background.default,
        p: 2,
        backgroundImage: "radial-gradient(circle at 50% 14em, #f5f5f5 0%, #e0e0e0 60%, #f0f0f0 100%)",
        transition: "background-image 0.5s ease"
      }}
    >
      <Container maxWidth="xs">
        <Zoom in={true} timeout={800}>
          <Paper 
            elevation={6} 
            sx={{ 
              p: isMobile ? 3 : 4, 
              textAlign: "center",
              borderRadius: 3,
              backgroundColor: theme.palette.background.paper,
              boxShadow: theme.shadows[8],
              transition: "all 0.3s ease",
              transform: "translateY(0)",
              '&:hover': {
                boxShadow: theme.shadows[12],
                transform: "translateY(-5px)"
              }
            }}
          >
            <Box 
              sx={{ 
                display: "flex", 
                flexDirection: "column", 
                alignItems: "center" 
              }}
            >
              <Avatar 
                src={logo}
                sx={{ 
                  bgcolor: "primary.main",
                  width: 70,
                  height: 70,
                  mb: 2,
                  p: 1
                }}
              >
                <ChatIcon fontSize="large" />
              </Avatar>
              
              <Typography 
                variant="h4" 
                gutterBottom
                sx={{ 
                  fontSize: isMobile ? "1.75rem" : "2.125rem",
                  fontWeight: 600,
                  mb: 1,
                  backgroundImage: 'linear-gradient(45deg, #1e4b9b, #3378db)',
                  backgroundClip: 'text',
                  textFillColor: 'transparent',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                USV Chat
              </Typography>
              
              <Typography 
                variant="body1" 
                sx={{ 
                  mb: 2,
                  color: "text.secondary",
                  fontSize: isMobile ? "0.95rem" : "1rem"
                }}
              >
                Conectează-te pentru a începe conversațiile cu prietenii și colegii tăi
              </Typography>

              {error && (
                <Alert 
                  severity="error" 
                  sx={{ mb: 2, width: "100%" }}
                  onClose={() => setError("")}
                >
                  {error}
                </Alert>
              )}
              
              <Box 
                sx={{ 
                  display: "flex", 
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                  mb: 3,
                  py: 1,
                  px: 2,
                  width: "100%"
                }}
              >
                <LockIcon color="inherit" fontSize="small" />
                <Typography variant="body2">
                  Conversații criptate end-to-end
                </Typography>
              </Box>
              
              <Button
                variant="contained"
                startIcon={<GoogleIcon />}
                onClick={handleSignIn}
                fullWidth
                size={isMobile ? "medium" : "large"}
                disabled={loading}
                sx={{ 
                  py: isMobile ? 1 : 1.5,
                  borderRadius: 2,
                  textTransform: "none",
                  fontSize: isMobile ? "0.95rem" : "1rem",
                  fontWeight: 500,
                  boxShadow: 3,
                  transition: "all 0.3s ease",
                  backgroundColor: "primary.main",
                  "&:hover": {
                    transform: "translateY(-3px)",
                    boxShadow: 6,
                    backgroundColor: "primary.dark"
                  },
                  "&:active": {
                    transform: "translateY(1px)"
                  }
                }}
              >
                {loading ? "Se conectează..." : "Conectare cu Google"}
              </Button>
              
              <Typography 
                variant="body2" 
                sx={{ 
                  mt: 2,
                  color: "text.secondary"
                }}
              >
                * Doar pentru utilizatorii cu adresă de email instituțională USV sau USM
              </Typography>
              
              <Box sx={{ 
                mt: 3, 
                pt: 2, 
                borderTop: 1, 
                borderColor: "divider", 
                width: "100%" 
              }}>
                <Box sx={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  mb: 1
                }}>
                  <SecurityIcon fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: "text.secondary",
                      fontWeight: 500
                    }}
                  >
                    Caracteristici de securitate
                  </Typography>
                  <Tooltip title="Mai multe informații">
                    <IconButton 
                      size="small" 
                      onClick={toggleSecurityInfo}
                      sx={{ ml: 0.5 }}
                    >
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>

                <Collapse in={showSecurityInfo}>
                  <Box sx={{ 
                    bgcolor: 'rgba(0,0,0,0.02)',
                    borderRadius: 1,
                    p: 1.5,
                    mb: 2
                  }}>
                    <Typography variant="body2" align="left" paragraph>
                      <strong>Criptare end-to-end:</strong> Toate mesajele sunt criptate folosind AES-256 și pot fi
                      decriptate doar de participanții la conversație.
                    </Typography>
                    <Typography variant="body2" align="left">
                      <strong>Cheie unică:</strong> Fiecare conversație folosește o cheie unică derivată din 
                      identificatorii utilizatorilor, asigurând că mesajele rămân private.
                    </Typography>
                    <Link 
                      component="button"
                      variant="body2"
                      onClick={() => {}}
                      sx={{ display: 'block', mt: 1, textAlign: 'right' }}
                    >
                      Află mai multe
                    </Link>
                  </Box>
                </Collapse>
                
                <Box sx={{ 
                  display: "flex", 
                  flexDirection: "column", 
                  alignItems: "flex-start", 
                  px: 2
                }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                    <Typography variant="caption" sx={{ mr: 1 }}>•</Typography>
                    <Typography variant="caption" sx={{ textAlign: "left" }}>
                      Criptare end-to-end pentru toate mesajele
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                    <Typography variant="caption" sx={{ mr: 1 }}>•</Typography>
                    <Typography variant="caption" sx={{ textAlign: "left" }}>
                      Nimeni altcineva nu poate citi mesajele tale, nici măcar noi
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Typography variant="caption" sx={{ mr: 1 }}>•</Typography>
                    <Typography variant="caption" sx={{ textAlign: "left" }}>
                      Verificare de identitate pentru utilizatori
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              <Typography 
                variant="caption" 
                sx={{ 
                  mt: 2,
                  color: "text.secondary",
                  fontSize: "0.75rem"
                }}
              >
                Prin conectare, ești de acord cu Termenii și Condițiile noastre
              </Typography>
            </Box>
          </Paper>
        </Zoom>
      </Container>
    </Box>
  );
};

export default Auth;