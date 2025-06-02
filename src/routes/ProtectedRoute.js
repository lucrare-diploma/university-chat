// src/routes/ProtectedRoute.js
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { isAllowedEmail } from '../utils/accessControl';

const ProtectedRoute = ({ children }) => {
  const { currentUser, logout } = useAuth();
  const [accessChecked, setAccessChecked] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      if (currentUser && currentUser.email) {
        const allowed = isAllowedEmail(currentUser.email);
        if (!allowed) {
          // Dacă emailul nu este permis, deconectăm utilizatorul
          await logout();
          setHasAccess(false);
        } else {
          setHasAccess(true);
        }
      }
      setAccessChecked(true);
    };

    checkAccess();
  }, [currentUser, logout]);

  // Loading state while checking access
  if (!accessChecked) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          p: 3,
          gap: 2,
        }}
      >
        <CircularProgress size={40} />
        <Typography variant="body1" color="text.secondary">
          Se verifică accesul...
        </Typography>
      </Box>
    );
  }

  // Redirect to auth if not authenticated or no access
  if (!currentUser || !hasAccess) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};

export default ProtectedRoute;