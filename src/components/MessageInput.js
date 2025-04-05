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
  alpha
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import LockIcon from "@mui/icons-material/Lock";
import MicIcon from "@mui/icons-material/Mic";
import InsertPhotoIcon from "@mui/icons-material/InsertPhoto";
import KeyboardIcon from "@mui/icons-material/Keyboard";
import CloseIcon from "@mui/icons-material/Close";

// Common emojis for quick access
const COMMON_EMOJIS = [
  "😊", "😂", "❤️", "👍", "🙏", "🔥", "✨", "😍", 
  "🤣", "😁", "👋", "👏", "🎉", "🤔", "👀", "😅",
  "🥰", "😎", "👌", "🙄", "😢", "🤦‍♂️", "🤦‍♀️", "🤷‍♂️"
];

const MessageInput = ({ onSendMessage, isMobile }) => {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showAttachOptions, setShowAttachOptions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [recording, setRecording] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const theme = useTheme();

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

  return (
    <Box 
      component="form"
      onSubmit={handleSubmit}
      sx={{
        p: isMobile ? 1.5 : 2,
        backgroundColor: "background.paper",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        borderTop: 1,
        borderColor: "divider",
      }}
    >
      {/* Attach options */}
      <Collapse in={showAttachOptions}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: 1, 
            mb: 1.5, 
            display: "flex", 
            justifyContent: "space-around",
            borderRadius: 2,
            bgcolor: theme.palette.mode === 'dark' 
              ? alpha(theme.palette.background.default, 0.7) 
              : alpha(theme.palette.background.default, 0.7)
          }}
        >
          <Tooltip title="Trimite imagine">
            <IconButton color="primary" onClick={handlePhotoUpload}>
              <InsertPhotoIcon />
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
            >
              {recording ? <CloseIcon /> : <MicIcon />}
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
            p: 1,
            bgcolor: alpha(theme.palette.error.main, 0.05),
            animation: "pulse 1.5s infinite"
          }}
        >
          <Box 
            sx={{ 
              width: 10, 
              height: 10, 
              borderRadius: "50%", 
              bgcolor: "error.main", 
              mr: 1.5,
              "@keyframes pulse": {
                "0%": { opacity: 0.6 },
                "50%": { opacity: 1 },
                "100%": { opacity: 0.6 }
              },
              animation: "pulse 1s infinite"
            }} 
          />
          <Box sx={{ flexGrow: 1, typography: "body2" }}>
            Înregistrare în curs...
          </Box>
          <IconButton size="small" onClick={toggleRecording}>
            <SendIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={toggleRecording} color="error">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      ) : (
        <Box sx={{ display: "flex", alignItems: "center" }}>
          {!isMobile && (
            <IconButton 
              sx={{ mr: 1 }} 
              color={showAttachOptions ? "primary" : "default"}
              onClick={handleAttachClick}
            >
              <AttachFileIcon />
            </IconButton>
          )}
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Scrie un mesaj criptat..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            inputRef={inputRef}
            multiline
            maxRows={3}
            size={isMobile ? "small" : "medium"}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Tooltip title="Mesajele sunt criptate end-to-end">
                    <LockIcon 
                      fontSize="small" 
                      color="success" 
                      sx={{ 
                        opacity: 0.7,
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
                    <EmojiEmotionsIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
            sx={{ 
              mr: 1,
              "& .MuiOutlinedInput-root": {
                borderRadius: 3,
                fontSize: isMobile ? "0.95rem" : "1rem",
                transition: "all 0.2s ease",
                "&.Mui-focused": {
                  boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`
                }
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
                size={isMobile ? "medium" : "large"}
                sx={{
                  backgroundColor: message.trim() && !sending ? "primary.main" : "action.disabledBackground",
                  color: "white",
                  "&:hover": {
                    backgroundColor: "primary.dark",
                  },
                  width: isMobile ? 40 : 48,
                  height: isMobile ? 40 : 48,
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
                {sending ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
              </IconButton>
            </Zoom>
          ) : (
            <IconButton 
              color="primary"
              onClick={toggleRecording}
              size={isMobile ? "medium" : "large"}
              sx={{
                width: isMobile ? 40 : 48,
                height: isMobile ? 40 : 48,
                transition: "all 0.2s ease"
              }}
            >
              {recording ? <KeyboardIcon /> : <MicIcon />}
            </IconButton>
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
            <Paper sx={{ p: 1.5, maxWidth: 270 }}>
              <Grid container spacing={1}>
                {COMMON_EMOJIS.map((emoji, index) => (
                  <Grid item key={index}>
                    <Button
                      variant="text"
                      onClick={() => addEmoji(emoji)}
                      sx={{ 
                        minWidth: 'auto', 
                        fontSize: '1.2rem',
                        p: 0.5,
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
      )}
    </Box>
  );
};

export default MessageInput;