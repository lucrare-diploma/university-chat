// src/components/NotFound.js
import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  useTheme,
  useMediaQuery
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleGoHome = () => {
    navigate('/', { replace: true });
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default',
        p: 3,
        textAlign: 'center'
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: isMobile ? 3 : 4,
          borderRadius: 3,
          maxWidth: 500,
          width: '100%'
        }}
      >
        <ErrorOutlineIcon
          sx={{
            fontSize: isMobile ? 64 : 80,
            color: 'error.main',
            mb: 2
          }}
        />
        
        <Typography
          variant={isMobile ? 'h4' : 'h3'}
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 600,
            color: 'text.primary'
          }}
        >
          404
        </Typography>
        
        <Typography
          variant="h6"
          component="h2"
          gutterBottom
          sx={{
            color: 'text.secondary',
            mb: 2
          }}
        >
          Pagina nu a fost găsită
        </Typography>
        
        <Typography
          variant="body1"
          paragraph
          sx={{
            color: 'text.secondary',
            mb: 3
          }}
        >
          Ne pare rău, dar pagina pe care o căutați nu există sau a fost mutată.
        </Typography>
        
        <Button
          variant="contained"
          size="large"
          startIcon={<HomeIcon />}
          onClick={handleGoHome}
          sx={{
            textTransform: 'none',
            px: 3,
            py: 1
          }}
        >
          Înapoi la chat
        </Button>
      </Paper>
    </Box>
  );
};

export default NotFound;