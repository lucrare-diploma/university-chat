// src/components/AISuggestions.js
import React from 'react';
import {
  Box,
  Typography,
  Button,
  Divider,
  CircularProgress,
  alpha,
  Paper,
  Fade
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { useTheme } from '@mui/material/styles';
import { useAI } from '../context/AIContext';

const AISuggestions = ({ 
  suggestions, 
  loading, 
  onSuggestionClick,
  visible = true
}) => {
  const theme = useTheme();
  const { aiProvider } = useAI();
  
  if (!visible || !suggestions || suggestions.length === 0) {
    return null;
  }
  
  return (
    <Fade in={visible}>
      <Paper
        elevation={1}
        sx={{ 
          mb: 2,
          p: 1.5,
          borderRadius: 2,
          bgcolor: alpha(theme.palette.primary.light, 0.07),
          border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
        }}
      >
        <Box 
          sx={{ 
            display: "flex", 
            alignItems: "center", 
            mb: 1,
          }}
        >
          <SmartToyIcon 
            fontSize="small" 
            color="primary" 
            sx={{ mr: 1, opacity: 0.8 }} 
          />
          <Typography variant="body2" color="primary.main" sx={{ fontWeight: 500, flexGrow: 1 }}>
            Sugestii generate de {aiProvider === 'openai' ? 'OpenAI' : 'AI'}
          </Typography>
          {loading && (
            <CircularProgress size={14} sx={{ ml: 1 }} />
          )}
        </Box>
        
        <Divider sx={{ mb: 1.5 }} />
        
        <Box 
          sx={{ 
            display: "flex", 
            flexDirection: "column", 
            gap: 1,
          }}
        >
          {suggestions.map((suggestion, index) => (
            <Button
              key={index}
              variant="outlined"
              size="small"
              onClick={() => onSuggestionClick(suggestion)}
              startIcon={<AutoAwesomeIcon fontSize="small" />}
              sx={{
                justifyContent: "flex-start",
                textTransform: "none",
                borderRadius: 2,
                py: 0.5,
                px: 1.5,
                fontWeight: 400,
                textAlign: "left",
                borderColor: alpha(theme.palette.primary.main, 0.3),
                "&:hover": {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  borderColor: theme.palette.primary.main,
                }
              }}
            >
              {suggestion}
            </Button>
          ))}
        </Box>
      </Paper>
    </Fade>
  );
};

export default AISuggestions;