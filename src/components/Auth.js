import React from "react";
import { Box, Button, Typography, Paper } from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import { useAuth } from "../context/AuthContext";

const Auth = () => {
  const { signInWithGoogle } = useAuth();

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh"
      }}
    >
      <Paper elevation={3} sx={{ p: 4, maxWidth: 400, textAlign: "center" }}>
        <Typography variant="h4" gutterBottom>
          Chat App
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Conectează-te pentru a începe conversațiile
        </Typography>
        <Button
          variant="contained"
          startIcon={<GoogleIcon />}
          onClick={signInWithGoogle}
          sx={{ mt: 2 }}
        >
          Conectare cu Google
        </Button>
      </Paper>
    </Box>
  );
};

export default Auth;