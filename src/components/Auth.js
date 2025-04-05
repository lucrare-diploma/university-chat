import React from "react";
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  useTheme, 
  useMediaQuery,
  Container,
  Avatar
} from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import ChatIcon from "@mui/icons-material/Chat";
import LockIcon from "@mui/icons-material/Lock";
import SecurityIcon from "@mui/icons-material/Security";
import { useAuth } from "../context/AuthContext";

const Auth = () => {
  const { signInWithGoogle } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: theme.palette.background.default,
        p: 2
      }}
    >
      <Container maxWidth="xs">
        <Paper 
          elevation={3} 
          sx={{ 
            p: isMobile ? 3 : 4, 
            textAlign: "center",
            borderRadius: 2,
            backgroundColor: theme.palette.background.paper
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
              sx={{ 
                bgcolor: "primary.main",
                width: 56,
                height: 56,
                mb: 2
              }}
            >
              <ChatIcon fontSize="large" />
            </Avatar>
            
            <Typography 
              variant="h4" 
              gutterBottom
              sx={{ 
                fontSize: isMobile ? "1.75rem" : "2.125rem",
                fontWeight: 500,
                mb: 1
              }}
            >
              Chat App
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
            
            <Box 
              sx={{ 
                display: "flex", 
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
                mb: 3,
                bgcolor: "success.light",
                color: "success.contrastText",
                py: 1,
                px: 2,
                borderRadius: 2,
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
              onClick={signInWithGoogle}
              fullWidth
              size={isMobile ? "medium" : "large"}
              sx={{ 
                py: isMobile ? 1 : 1.5,
                borderRadius: 2,
                textTransform: "none",
                fontSize: isMobile ? "0.95rem" : "1rem"
              }}
            >
              Conectare cu Google
            </Button>
            
            <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: "divider", width: "100%" }}>
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
              </Box>
              
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
      </Container>
    </Box>
  );
};

export default Auth;