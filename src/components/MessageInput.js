import React, { useState, useRef, useEffect } from "react";
import { 
  Box, 
  TextField, 
  IconButton, 
  CircularProgress, 
  InputAdornment, 
  Tooltip, 
  Paper,
  Popover,
  Grid,
  useTheme,
  Zoom,
  Slide,
  Collapse,
  Button,
  alpha,
  Chip,
  Typography,
  Fade,
  Divider,
  useMediaQuery
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import LockIcon from "@mui/icons-material/Lock";
import MicIcon from "@mui/icons-material/Mic";
import InsertPhotoIcon from "@mui/icons-material/InsertPhoto";
import KeyboardIcon from "@mui/icons-material/Keyboard";
import CloseIcon from "@mui/icons-material/Close";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { generateSuggestions, applySuggestion } from "../utils/suggestionUtils";

// Emoji-uri comune pentru acces rapid
const COMMON_EMOJIS = [
  "😊", "😂", "❤️", "👍", "🙏", "🔥", "✨", "😍", 
  "🤣", "😁", "👋", "👏", "🎉", "🤔", "👀", "😅",
  "🥰", "😎", "👌", "🙄", "😢", "🤦‍♂️", "🤦‍♀️", "🤷‍♂️"
];

const MessageInput = ({ 
  onSendMessage, 
  isMobile, 
  aiSuggestions = [], 
  loadingSuggestions = false,
  onSuggestionUsed
}) => {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showAttachOptions, setShowAttachOptions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [recording, setRecording] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [wordSuggestions, setWordSuggestions] = useState([]);
  const [showWordSuggestions, setShowWordSuggestions] = useState(false);
  const [suggestionEnabled, setSuggestionEnabled] = useState(true);
  const [aiEnabled, setAiEnabled] = useState(true);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const theme = useTheme();
  const { currentUser } = useAuth();
  
  // Media queries suplimentare pentru diferite dimensiuni de ecran
  const isExtraSmall = useMediaQuery(theme.breakpoints.down('xs'));
  const isVerySmall = useMediaQuery('(max-width:380px)'); // Pentru telefoane foarte mici

  // Fetch user preferences
  useEffect(() => {
    const fetchUserPreferences = async () => {
      if (currentUser) {
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            // Update local state with user preferences
            if (userData.suggestionEnabled !== undefined) {
              setSuggestionEnabled(userData.suggestionEnabled);
            }
            if (userData.aiEnabled !== undefined) {
              setAiEnabled(userData.aiEnabled);
            }
          }
        } catch (error) {
          console.error("Eroare la obținerea preferințelor utilizatorului:", error);
        }
      }
    };

    fetchUserPreferences();
  }, [currentUser]);

  // Update suggestions when message changes
  useEffect(() => {
    if (suggestionEnabled && message.trim() !== '') {
      const newSuggestions = generateSuggestions(message);
      setWordSuggestions(newSuggestions);
      setShowWordSuggestions(newSuggestions.length > 0);
    } else {
      setWordSuggestions([]);
      setShowWordSuggestions(false);
    }
  }, [message, suggestionEnabled]);

  useEffect(() => {
    // Auto focus input on component mount
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (!message.trim() || sending) return;
    
    try {
      setSending(true);
      // Salvăm mesajul într-o variabilă temporară și curățăm input-ul imediat
      // pentru o experiență de utilizare mai bună
      const messageText = message;
      setMessage("");
      
      // Trimitem mesajul
      await onSendMessage(messageText);
    } catch (error) {
      console.error("Eroare la trimiterea mesajului:", error);
      // Dacă apare o eroare, restaurăm mesajul în input
      setMessage(message);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  // Handler pentru tasta Enter
  const handleKeyDown = (e) => {
    // Selectează o sugestie folosind tastele 1, 2, 3
    if (showWordSuggestions && wordSuggestions.length > 0 && e.altKey) {
      const suggestionIndex = parseInt(e.key) - 1;
      if (suggestionIndex >= 0 && suggestionIndex < wordSuggestions.length) {
        e.preventDefault();
        handleWordSuggestionClick(wordSuggestions[suggestionIndex]);
        return;
      }
    }
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Toggle emoji picker
  const handleEmojiClick = (event) => {
    setAnchorEl(event.currentTarget);
    setShowEmojiPicker(!showEmojiPicker);
    if (showAttachOptions) setShowAttachOptions(false);
  };

  // Toggle attach options
  const handleAttachClick = () => {
    setShowAttachOptions(!showAttachOptions);
    if (showEmojiPicker) {
      setShowEmojiPicker(false);
      setAnchorEl(null);
    }
  };

  // Add emoji to message
  const addEmoji = (emoji) => {
    setMessage(prev => prev + emoji);
    inputRef.current?.focus();
  };

  // Handle word suggestion click
  const handleWordSuggestionClick = (suggestion) => {
    const newText = applySuggestion(message, suggestion);
    setMessage(newText);
    inputRef.current?.focus();
  };

  // Handle AI suggestion click
  const handleAISuggestionClick = (suggestion) => {
    setMessage(suggestion);
    // Notifică părintele că sugestia a fost folosită
    if (onSuggestionUsed) {
      onSuggestionUsed(suggestion);
    }
    inputRef.current?.focus();
  };

  // Toggle voice recording mode
  const toggleRecording = () => {
    setRecording(!recording);
    if (recording) {
      // Process recording (in a real app)
      console.log("Recording stopped and processed");
    } else {
      // Start recording (in a real app)
      console.log("Recording started");
    }
  };

  // Trigger file input click
  const handlePhotoUpload = () => {
    fileInputRef.current?.click();
    setShowAttachOptions(false);
  };

  // Decide când să afișăm sugestiile AI
  const shouldShowAISuggestions = 
    aiEnabled && 
    aiSuggestions.length > 0 && 
    !message.trim(); // Afișăm doar când nu există text scris

  return (
    <Box 
      component="form"
      onSubmit={handleSubmit}
      sx={{
        p: isVerySmall ? 0.75 : (isMobile ? 1 : 2),
        backgroundColor: "background.paper",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        borderTop: 1,
        borderColor: "divider",
        width: "100%",
        boxSizing: "border-box"
      }}
    >
      {/* AI Suggestions area */}
      {shouldShowAISuggestions && (
        <Fade in={shouldShowAISuggestions}>
          <Box 
            sx={{ 
              mb: isVerySmall ? 1 : 2,
              p: isVerySmall ? 0.75 : 1.5,
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
                fontSize={isVerySmall ? "small" : "small"} 
                color="primary" 
                sx={{ mr: 1, opacity: 0.8 }} 
              />
              <Typography 
                variant={isVerySmall ? "caption" : "body2"} 
                color="primary.main" 
                sx={{ fontWeight: 500 }}
              >
                {isVerySmall ? "Sugestii AI" : "Sugestii de răspuns generate de AI"}
              </Typography>
              {loadingSuggestions && (
                <CircularProgress size={isVerySmall ? 10 : 14} sx={{ ml: 1 }} />
              )}
            </Box>
            
            <Divider sx={{ mb: 1.5 }} />
            
            <Box 
              sx={{ 
                display: "flex", 
                flexDirection: "column", 
                gap: 1,
                flexWrap: "wrap"
              }}
            >
              {aiSuggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outlined"
                  size={isVerySmall ? "small" : "small"}
                  onClick={() => handleAISuggestionClick(suggestion)}
                  startIcon={
                    !isVerySmall && <AutoAwesomeIcon fontSize="small" />
                  }
                  sx={{
                    justifyContent: "flex-start",
                    textTransform: "none",
                    borderRadius: 2,
                    py: isVerySmall ? 0.25 : 0.5,
                    px: isVerySmall ? 0.75 : 1.5,
                    fontWeight: 400,
                    fontSize: isVerySmall ? "0.7rem" : "0.8rem",
                    textAlign: "left",
                    borderColor: alpha(theme.palette.primary.main, 0.3),
                    "&:hover": {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      borderColor: theme.palette.primary.main,
                    }
                  }}
                >
                  {isVerySmall 
                    ? (suggestion.length > 40 ? suggestion.substring(0, 37) + '...' : suggestion)
                    : (suggestion.length > 80 ? suggestion.substring(0, 77) + '...' : suggestion)
                  }
                </Button>
              ))}
            </Box>
          </Box>
        </Fade>
      )}

      {/* Attach options */}
      <Collapse in={showAttachOptions}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: isVerySmall ? 0.5 : 1, 
            mb: isVerySmall ? 0.75 : 1.5, 
            display: "flex", 
            justifyContent: "space-around",
            borderRadius: 2,
            bgcolor: theme.palette.mode === 'dark' 
              ? alpha(theme.palette.background.default, 0.7) 
              : alpha(theme.palette.background.default, 0.7)
          }}
        >
          <Tooltip title="Trimite imagine">
            <IconButton color="primary" onClick={handlePhotoUpload} size={isVerySmall ? "small" : "medium"}>
              <InsertPhotoIcon fontSize={isVerySmall ? "small" : "medium"} />
            </IconButton>
          </Tooltip>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              console.log("File selected:", e.target.files);
              // Handle file upload (in a real app)
            }}
          />
          
          <Tooltip title={recording ? "Anulează înregistrarea" : "Înregistrează mesaj vocal"}>
            <IconButton 
              color={recording ? "error" : "primary"} 
              onClick={toggleRecording}
              size={isVerySmall ? "small" : "medium"}
            >
              {recording ? <CloseIcon fontSize={isVerySmall ? "small" : "medium"} /> : <MicIcon fontSize={isVerySmall ? "small" : "medium"} />}
            </IconButton>
          </Tooltip>
        </Paper>
      </Collapse>

      {/* Voice recording UI */}
      {recording ? (
        <Box 
          sx={{ 
            display: "flex", 
            alignItems: "center", 
            border: 1, 
            borderColor: "error.main", 
            borderRadius: 3,
            p: isVerySmall ? 0.5 : 1,
            bgcolor: alpha(theme.palette.error.main, 0.05),
            animation: "pulse 1.5s infinite"
          }}
        >
          <Box 
            sx={{ 
              width: isVerySmall ? 6 : 10, 
              height: isVerySmall ? 6 : 10, 
              borderRadius: "50%", 
              bgcolor: "error.main", 
              mr: isVerySmall ? 0.75 : 1.5,
              "@keyframes pulse": {
                "0%": { opacity: 0.6 },
                "50%": { opacity: 1 },
                "100%": { opacity: 0.6 }
              },
              animation: "pulse 1s infinite"
            }} 
          />
          <Box sx={{ flexGrow: 1, typography: isVerySmall ? "caption" : "body2" }}>
            Înregistrare în curs...
          </Box>
          <IconButton size={isVerySmall ? "small" : "small"} onClick={toggleRecording}>
            <SendIcon fontSize={isVerySmall ? "small" : "small"} />
          </IconButton>
          <IconButton size={isVerySmall ? "small" : "small"} onClick={toggleRecording} color="error">
            <CloseIcon fontSize={isVerySmall ? "small" : "small"} />
          </IconButton>
        </Box>
      ) : (
        <Box sx={{ display: "flex", alignItems: "center", flexDirection: "column", width: "100%" }}>
          {/* Text input */}
          <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
            {/* Butonul de atașare este ascuns pe ecrane foarte mici pentru a economisi spațiu */}
            {!isVerySmall && !isMobile && (
              <IconButton 
                sx={{ mr: 0.5 }} 
                color={showAttachOptions ? "primary" : "default"}
                onClick={handleAttachClick}
                size={isVerySmall ? "small" : "medium"}
              >
                <AttachFileIcon fontSize={isVerySmall ? "small" : "medium"} />
              </IconButton>
            )}
            
            <TextField
              fullWidth
              variant="outlined"
              placeholder={isVerySmall ? "Scrie un mesaj..." : "Scrie un mesaj criptat..."}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              inputRef={inputRef}
              multiline
              maxRows={isVerySmall ? 2 : 3}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Tooltip title="Mesajele sunt criptate end-to-end">
                      <LockIcon 
                        fontSize="small" 
                        color="success" 
                        sx={{ 
                          opacity: 0.7,
                          fontSize: isVerySmall ? "0.6rem" : "0.8rem",
                          animation: message.length > 0 ? "none" : "pulse 2s infinite",
                          "@keyframes pulse": {
                            "0%": {
                              opacity: 0.5,
                            },
                            "50%": {
                              opacity: 1,
                            },
                            "100%": {
                              opacity: 0.5,
                            }
                          }
                        }} 
                      />
                    </Tooltip>
                  </InputAdornment>
                ),
                endAdornment: isMobile ? (
                  <InputAdornment position="end">
                    <IconButton 
                      color={showAttachOptions ? "primary" : "default"} 
                      size="small"
                      onClick={handleAttachClick}
                    >
                      <AttachFileIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : (
                  <InputAdornment position="end">
                    <IconButton 
                      color={showEmojiPicker ? "primary" : "default"} 
                      size="small"
                      onClick={handleEmojiClick}
                    >
                      <EmojiEmotionsIcon fontSize={isVerySmall ? "small" : "medium"} />
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{ 
                mr: 0.5,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 3,
                  fontSize: isVerySmall ? "0.8rem" : (isMobile ? "0.9rem" : "1rem"),
                  transition: "all 0.2s ease",
                  "&.Mui-focused": {
                    boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`
                  }
                },
                "& .MuiInputBase-inputMultiline": {
                  // Limitează înălțimea input-ului multiline pe mobile pentru a evita probleme cu tastatura
                  maxHeight: isVerySmall ? "40px" : (isMobile ? "60px" : "120px"),
                }
              }}
              autoFocus
            />
            
            {message.trim() ? (
              <Zoom in={!!message.trim()}>
                <IconButton 
                  color="primary" 
                  type="submit" 
                  disabled={!message.trim() || sending}
                  size={isVerySmall ? "small" : (isMobile ? "medium" : "large")}
                  sx={{
                    backgroundColor: message.trim() && !sending ? "primary.main" : "action.disabledBackground",
                    color: "white",
                    "&:hover": {
                      backgroundColor: "primary.dark",
                    },
                    width: isVerySmall ? 32 : (isMobile ? 36 : 48),
                    height: isVerySmall ? 32 : (isMobile ? 36 : 48),
                    transition: "all 0.2s ease",
                    boxShadow: 2,
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: 3
                    },
                    "&:active": {
                      transform: "translateY(0)",
                    }
                  }}
                >
                  {sending ? 
                    <CircularProgress size={isVerySmall ? 16 : 24} color="inherit" /> : 
                    <SendIcon fontSize={isVerySmall ? "small" : "medium"} />
                  }
                </IconButton>
              </Zoom>
            ) : (
              <IconButton 
                color="primary"
                onClick={toggleRecording}
                size={isVerySmall ? "small" : (isMobile ? "medium" : "large")}
                sx={{
                  width: isVerySmall ? 32 : (isMobile ? 36 : 48),
                  height: isVerySmall ? 32 : (isMobile ? 36 : 48),
                  transition: "all 0.2s ease"
                }}
              >
                {recording ? 
                  <KeyboardIcon fontSize={isVerySmall ? "small" : "medium"} /> : 
                  <MicIcon fontSize={isVerySmall ? "small" : "medium"} />
                }
              </IconButton>
            )}
          </Box>

          {/* Word suggestions row - afișează până la 3 sugestii de cuvinte */}
          {suggestionEnabled && showWordSuggestions && wordSuggestions.length > 0 && (
            <Box 
              sx={{ 
                display: "flex", 
                flexWrap: "wrap", 
                gap: isVerySmall ? 0.5 : 1, 
                mt: isVerySmall ? 0.75 : 1.5, 
                width: "100%",
                justifyContent: "center",
                animation: "fadeIn 0.3s ease-in-out",
                "@keyframes fadeIn": {
                  "0%": { opacity: 0, transform: "translateY(5px)" },
                  "100%": { opacity: 1, transform: "translateY(0)" }
                }
              }}
            >
              {wordSuggestions.slice(0, isVerySmall ? 2 : 3).map((suggestion, index) => (
                <Chip
                  key={index}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box 
                        component="span" 
                        sx={{ 
                          fontSize: isVerySmall ? '0.6rem' : '0.7rem', 
                          bgcolor: 'rgba(0,0,0,0.1)', 
                          borderRadius: '50%',
                          width: isVerySmall ? 14 : 16, 
                          height: isVerySmall ? 14 : 16, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          mr: 0.5
                        }}
                      >
                        {index + 1}
                      </Box>
                      {suggestion}
                    </Box>
                  }
                  size="small"
                  onClick={() => handleWordSuggestionClick(suggestion)}
                  clickable
                  color="primary"
                  variant="outlined"
                  sx={{ 
                    borderRadius: 1.5,
                    transition: "all 0.2s",
                    fontSize: isVerySmall ? "0.65rem" : "0.75rem",
                    height: isVerySmall ? 24 : 28,
                    "&:hover": {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      transform: "translateY(-2px)"
                    },
                    fontWeight: 400
                  }}
                />
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* Emoji picker popover */}
      <Popover
        open={showEmojiPicker}
        anchorEl={anchorEl}
        onClose={() => setShowEmojiPicker(false)}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        sx={{ mt: -1 }}
      >
        <Paper sx={{ p: isVerySmall ? 0.75 : 1.5, maxWidth: isVerySmall ? 240 : 270 }}>
          <Grid container spacing={isVerySmall ? 0.5 : 1}>
            {COMMON_EMOJIS.map((emoji, index) => (
              <Grid item key={index}>
                <Button
                  variant="text"
                  onClick={() => addEmoji(emoji)}
                  sx={{ 
                    minWidth: 'auto', 
                    fontSize: isVerySmall ? '1rem' : '1.2rem',
                    p: isVerySmall ? 0.3 : 0.5,
                    borderRadius: 1,
                    "&:hover": {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1)
                    }
                  }}
                >
                  {emoji}
                </Button>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Popover>
    </Box>
  );
};

export default MessageInput;