import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  Typography,
  Paper,
  Divider,
  Avatar,
  AppBar,
  Toolbar,
  IconButton,
  useTheme,
  useMediaQuery,
  Badge,
  CircularProgress,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  Fade,
  Snackbar,
  Button,
  alpha
} from "@mui/material";
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MenuIcon from "@mui/icons-material/Menu";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import LockIcon from "@mui/icons-material/Lock";
import InfoIcon from "@mui/icons-material/Info";
import DeleteIcon from "@mui/icons-material/Delete";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  where,
  serverTimestamp,
  limit,
  getDocs,
  updateDoc,
  doc,
  getDoc,
  setDoc,
  writeBatch
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import Message from "./Message";
import MessageInput from "./MessageInput";
import { encryptMessage, decryptMessage, generateChatKey } from "../utils/encryption";

const Chat = ({ selectedUser, onBack, onSwipe }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [chatKey, setChatKey] = useState('');
  const [infoOpen, setInfoOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [loadedAll, setLoadedAll] = useState(false);
  const [messagesLimit, setMessagesLimit] = useState(20);
  const [touchStart, setTouchStart] = useState(null);

  const { currentUser } = useAuth();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const prevScrollHeightRef = useRef(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isPortrait = useMediaQuery('(orientation: portrait)');

  // Verifică dacă utilizatorul actual este întro conversație cu sine
  const isSelfChat = selectedUser?.id === currentUser?.uid;

  // Generează ID-ul conversației - sortează ID-urile utilizatorilor pentru consistență
  const getChatId = useCallback(() => {
    // Pentru chat cu sine folosim un format special
    if (isSelfChat) {
      return `self_${currentUser.uid}`;
    }
    
    // Pentru chat-ul normal între doi utilizatori
    const ids = [currentUser.uid, selectedUser.id].sort();
    return `${ids[0]}_${ids[1]}`;
  }, [currentUser, selectedUser, isSelfChat]);

  // Generate encryption key for this chat when users are selected
  useEffect(() => {
    if (currentUser && selectedUser) {
      const key = generateChatKey(currentUser.uid, selectedUser.id);
      setChatKey(key);
      console.log("Cheia de criptare a fost generată pentru conversație");
    }
  }, [currentUser, selectedUser]);

  // Funcție pentru a derula la ultimul mesaj
  const scrollToBottom = (behavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Setup swipe gesture handlers (for mobile back navigation)
  const handleTouchStart = (e) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
  };

  const handleTouchEnd = (e) => {
    if (!touchStart || !onSwipe) return;

    const xDiff = touchStart.x - e.changedTouches[0].clientX;
    const yDiff = touchStart.y - e.changedTouches[0].clientY;

    // Only register horizontal swipes that are more significant than vertical
    if (Math.abs(xDiff) > Math.abs(yDiff) && Math.abs(xDiff) > 70) {
      if (xDiff < 0) { // Swiped right
        onSwipe("right");
      } else { // Swiped left
        onSwipe("left");
      }
    }

    setTouchStart(null);
  };

  // Handle infinite scroll
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container || loading || loadingMore || loadedAll) return;

    // Check if we're near the top of the scroll container
    if (container.scrollTop < 100) {
      loadMoreMessages();
    }
  };

  // Load more messages (for scrollback)
  const loadMoreMessages = async () => {
    if (loadingMore || loadedAll || !chatKey) return;

    try {
      setLoadingMore(true);
      prevScrollHeightRef.current = messagesContainerRef.current?.scrollHeight || 0;

      const chatId = getChatId();
      const messagesRef = collection(db, "messages");
      const q = query(
        messagesRef,
        where("chatId", "==", chatId),
        orderBy("createdAt", "asc"),
        limit(messagesLimit + 20)
      );

      const snapshot = await getDocs(q);
      const messagesList = [];

      snapshot.forEach((doc) => {
        const messageData = doc.data();
        const createdAt = messageData.createdAt ?
          (messageData.createdAt.toDate ? messageData.createdAt.toDate() : messageData.createdAt)
          : new Date();

        // Decrypt the message text if it's encrypted
        let decryptedText = messageData.text;
        if (messageData.encrypted) {
          decryptedText = decryptMessage(messageData.text, chatKey);
        }

        messagesList.push({
          id: doc.id,
          ...messageData,
          text: decryptedText,
          createdAt
        });
      });

      setMessages(messagesList);
      setMessagesLimit(prevLimit => prevLimit + 20);
      setLoadedAll(messagesList.length < messagesLimit + 20);

    } catch (error) {
      console.error("Error loading more messages:", error);
    } finally {
      setLoadingMore(false);

      // Maintain scroll position after loading more messages
      setTimeout(() => {
        if (messagesContainerRef.current) {
          const newScrollHeight = messagesContainerRef.current.scrollHeight;
          const scrollDiff = newScrollHeight - prevScrollHeightRef.current;
          messagesContainerRef.current.scrollTop = scrollDiff;
        }
      }, 100);
    }
  };

  // Încarcă mesajele în timp real
  useEffect(() => {
    if (!selectedUser || !currentUser || !chatKey) return;

    setLoading(true);
    setError(null);

    try {
      console.log("Încărcare mesaje pentru conversația între", currentUser.uid, "și", selectedUser.id);
      const chatId = getChatId();
      console.log("Chat ID:", chatId);

      const messagesRef = collection(db, "messages");
      const q = query(
        messagesRef,
        where("chatId", "==", chatId),
        orderBy("createdAt", "asc"),
        limit(messagesLimit)
      );

      console.log("Configurez listener pentru mesaje...");
      const unsubscribe = onSnapshot(q, (snapshot) => {
        console.log("Snapshot de mesaje primit, număr:", snapshot.size);
        const messagesList = [];

        snapshot.forEach((doc) => {
          const messageData = doc.data();
          // Verific dacă createdAt există și este un timestamp valid
          const createdAt = messageData.createdAt ?
            (messageData.createdAt.toDate ? messageData.createdAt.toDate() : messageData.createdAt)
            : new Date();

          // Decrypt the message text if it's encrypted
          let decryptedText = messageData.text;
          if (messageData.encrypted) {
            decryptedText = decryptMessage(messageData.text, chatKey);
          }

          messagesList.push({
            id: doc.id,
            ...messageData,
            text: decryptedText, // Replace encrypted text with decrypted text
            createdAt
          });
        });

        console.log("Mesaje procesate:", messagesList.length);
        setMessages(messagesList);
        setLoading(false);
        setLoadedAll(messagesList.length < messagesLimit);

        // Derulează la ultimul mesaj după ce se încarcă
        setTimeout(scrollToBottom, 100);
      }, (err) => {
        console.error("Eroare la ascultarea mesajelor:", err);
        setError("Nu s-au putut încărca mesajele: " + err.message);
        setLoading(false);
      });

      return () => {
        console.log("Curățare listener mesaje");
        unsubscribe();
      };
    } catch (error) {
      console.error("Eroare la configurarea listener-ului pentru mesaje:", error);
      setError("Eroare la configurare: " + error.message);
      setLoading(false);
    }
  }, [currentUser, selectedUser, getChatId, chatKey, messagesLimit]);

  // Marcarea mesajelor ca fiind citite când se deschide conversația
  useEffect(() => {
    const markMessagesAsRead = async () => {
      if (!selectedUser || !currentUser) return;
      
      // Dacă este chat cu sine, nu e necesar să marcăm mesajele ca fiind citite
      if (isSelfChat) return;

      try {
        const chatId = getChatId();
        const batch = writeBatch(db);
        let unreadCount = 0;

        // Obține mesajele necitite pentru această conversație
        const messagesRef = collection(db, "messages");
        const q = query(
          messagesRef,
          where("chatId", "==", chatId),
          where("receiverId", "==", currentUser.uid),
          where("read", "==", false)
        );

        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          snapshot.forEach((doc) => {
            batch.update(doc.ref, {
              read: true,
              readAt: serverTimestamp()
            });
            unreadCount++;
          });

          // Execută actualizarea în batch
          await batch.commit();
          console.log(`${unreadCount} mesaje marcate ca citite`);

          // Resetare contor mesaje necitite pentru acest utilizator
          if (unreadCount > 0) {
            const userUnreadCountsRef = doc(db, "userUnreadCounts", currentUser.uid);
            const userUnreadCountsDoc = await getDoc(userUnreadCountsRef);

            if (userUnreadCountsDoc.exists()) {
              const countsData = userUnreadCountsDoc.data();
              const updatedCounts = { ...countsData };
              delete updatedCounts[selectedUser.id]; // Șterge contorul pentru acest utilizator

              await setDoc(userUnreadCountsRef, updatedCounts);
            }
          }
        }
      } catch (error) {
        console.error("Eroare la marcarea mesajelor ca citite:", error);
      }
    };

    markMessagesAsRead();
  }, [currentUser, selectedUser, getChatId, isSelfChat]);

  // Derulează automat la ultimul mesaj când se adaugă mesaje noi
  useEffect(() => {
    if (!loading && messages.length > 0) {
      // Only auto-scroll if we're already near the bottom
      const container = messagesContainerRef.current;
      if (container) {
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
        if (isNearBottom) {
          scrollToBottom();
        }
      }
    }
  }, [messages, loading]);

  // Trimite un mesaj
  const handleSendMessage = async (text) => {
    if (!text.trim() || !currentUser || !selectedUser || !chatKey) return;

    try {
      const chatId = getChatId();
      console.log("Trimit mesaj criptat în chat ID:", chatId);

      // Encrypt the message before saving to Firestore
      const encryptedText = encryptMessage(text, chatKey);

      if (!encryptedText) {
        throw new Error("Encryption failed");
      }

      // În cazul conversației cu sine, expeditorul și destinatarul sunt aceeași persoană
      const receiverId = isSelfChat ? currentUser.uid : selectedUser.id;

      // Adaugă mesajul în colecția de mesaje
      await addDoc(collection(db, "messages"), {
        text: encryptedText,
        encrypted: true, // Flag that indicates this message is encrypted
        senderId: currentUser.uid,
        receiverId: receiverId,
        senderName: currentUser.displayName || "Utilizator",
        senderPhoto: currentUser.photoURL,
        chatId,
        createdAt: serverTimestamp(), // Folosește serverTimestamp pentru consistență
        read: isSelfChat, // Marcăm deja ca citit dacă este chat cu sine
        delivered: true // Marcăm mesajul ca livrat
      });

      // Incrementează contorul de mesaje necitite pentru destinatar doar dacă nu e chat cu sine
      if (!isSelfChat) {
        const userUnreadCountsRef = doc(db, "userUnreadCounts", receiverId);

        try {
          // Verifică dacă documentul există
          const docSnap = await getDoc(userUnreadCountsRef);

          if (docSnap.exists()) {
            // Actualizează contorul existent
            const countsData = docSnap.data();
            const currentCount = countsData[currentUser.uid] || 0;

            await updateDoc(userUnreadCountsRef, {
              [currentUser.uid]: currentCount + 1
            });
          } else {
            // Creează documentul nou
            await setDoc(userUnreadCountsRef, {
              [currentUser.uid]: 1
            });
          }
        } catch (error) {
          console.error("Eroare la actualizarea contorului de mesaje necitite:", error);
        }
      }

      console.log("Mesaj criptat trimis cu succes");
      scrollToBottom("smooth");
    } catch (error) {
      console.error("Eroare la trimiterea mesajului:", error);
      setError("Nu s-a putut trimite mesajul: " + error.message);
    }
  };

  // Menu handlers
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCopyKey = () => {
    if (chatKey) {
      navigator.clipboard.writeText(chatKey)
        .then(() => {
          setSnackbarMessage("Cheia de criptare a fost copiată în clipboard");
          setSnackbarOpen(true);
        })
        .catch(err => {
          console.error("Eroare la copierea cheii:", err);
        });
    }
    handleMenuClose();
  };

  const toggleInfoDrawer = () => {
    setInfoOpen(!infoOpen);
    handleMenuClose();
  };

  // Format date for the drawer
  const formatDate = (date) => {
    if (!date) return "Necunoscut";
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(date).toLocaleDateString('ro-RO', options);
  };

  const badgeStatus = selectedUser?.online ? "success" : "default";

  // Text pentru titlul conversației
  const chatTitle = isSelfChat ? "Notițe personale" : selectedUser?.displayName;

  return (
    <Paper
      sx={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 0,
        position: "relative",
        overflow: "hidden",
      }}
      elevation={0}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <AppBar
        position="sticky"
        color="primary"
        elevation={1}
        sx={{
          backgroundColor: isSelfChat ? "success.dark" : "primary.dark",
          borderBottom: 1,
          borderColor: "divider",
          zIndex: 10,
          top: 0
        }}
      >
        <Toolbar sx={{ minHeight: isMobile ? 56 : 64 }}>
          <IconButton
            edge="start"
            color="inherit"
            onClick={onBack}
            sx={{
              mr: 2,
              transition: "all 0.2s",
              color: "white",
              "&:hover": {
                backgroundColor: alpha("#ffffff", 0.1)
              }
            }}
            aria-label="înapoi"
          >
            {isMobile ? <ArrowBackIcon /> : <MenuIcon />}
          </IconButton>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            variant="dot"
            color={badgeStatus}
            sx={{
              "& .MuiBadge-badge": {
                boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
                width: 12,
                height: 12,
                borderRadius: '50%'
              }
            }}
          >
            <Avatar
              src={selectedUser?.photoURL}
              alt={selectedUser?.displayName}
              sx={{
                mr: 2,
                width: isMobile ? 40 : 48,
                height: isMobile ? 40 : 48,
                cursor: "pointer",
                transition: "transform 0.2s ease",
                "&:hover": {
                  transform: "scale(1.05)"
                }
              }}
              onClick={toggleInfoDrawer}
            >
              {selectedUser?.displayName?.charAt(0) || "U"}
            </Avatar>
          </Badge>
          <Box
            sx={{
              flexGrow: 1,
              cursor: "pointer",
              "&:hover": {
                opacity: 0.8
              }
            }}
            onClick={toggleInfoDrawer}
          >
            <Typography
              variant="h6"
              sx={{
                fontSize: isMobile ? "1rem" : "1.25rem",
                fontWeight: 500,
                color: "white"
              }}
            >
              {chatTitle}
            </Typography>
            <Typography
              variant="body2"
              color="white"
              sx={{
                fontSize: isMobile ? "0.75rem" : "0.875rem",
                display: "flex",
                alignItems: "center",
                opacity: 0.85
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor: selectedUser?.online ? "success.main" : "text.disabled",
                  mr: 0.5,
                  display: "inline-block"
                }}
              />
              {isSelfChat ? "Doar tu poți vedea aceste mesaje" : selectedUser?.online ? "Online" : "Offline"}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title="Mesaje criptate end-to-end">
              <LockIcon
                fontSize="small"
                sx={{
                  mr: 1,
                  color: "white",
                  animation: infoOpen ? "none" : "pulse 2s infinite",
                  "@keyframes pulse": {
                    "0%": {
                      opacity: 0.7,
                    },
                    "50%": {
                      opacity: 1,
                    },
                    "100%": {
                      opacity: 0.7,
                    }
                  }
                }}
              />
            </Tooltip>
            <IconButton
              color="inherit"
              aria-label="opțiuni"
              onClick={handleMenuOpen}
              sx={{ color: "white" }}
            >
              <MoreVertIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              PaperProps={{
                elevation: 3,
                sx: { minWidth: 200 }
              }}
            >
              <MenuItem onClick={toggleInfoDrawer}>
                <ListItemIcon>
                  <InfoIcon fontSize="small" />
                </ListItemIcon>
                <Typography variant="body2">Informații conversație</Typography>
              </MenuItem>
              <MenuItem onClick={handleCopyKey}>
                <ListItemIcon>
                  <ContentCopyIcon fontSize="small" />
                </ListItemIcon>
                <Typography variant="body2">Copiază cheia de criptare</Typography>
              </MenuItem>
              <Divider />
              <MenuItem sx={{ color: "error.main" }}>
                <ListItemIcon>
                  <DeleteIcon fontSize="small" color="error" />
                </ListItemIcon>
                <Typography variant="body2">Șterge conversația</Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ position: 'relative' }}>
        <Fade in={true}>
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            py: 0.5,
            zIndex: 5,
            bgcolor: alpha(theme.palette.success.light, 0.1)
          }}>
            <Tooltip title="Mesajele sunt criptate end-to-end">
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                fontSize: isMobile ? '0.7rem' : '0.8rem',
                color: 'text.secondary',
                px: 1,
                borderRadius: 10,
                "&:hover": {
                  color: 'success.main',
                  cursor: 'pointer'
                }
              }}
                onClick={toggleInfoDrawer}
              >
                <LockIcon sx={{ fontSize: isMobile ? '0.7rem' : '0.8rem', mr: 0.5 }} />
                {isSelfChat ? "Conversație privată" : "Conversație criptată"}
              </Box>
            </Tooltip>
          </Box>
        </Fade>
      </Box>

      <Box
        ref={messagesContainerRef}
        sx={{
          flexGrow: 1,
          overflow: "auto",
          p: isMobile ? 1.5 : 2,
          display: "flex",
          flexDirection: "column",
          bgcolor: theme.palette.background.default,
          mt: 3,
          position: "relative",
          height: "calc(100% - 130px)" // Make room for header and input
        }}
        onScroll={handleScroll}
      >
        {loadingMore && (
          <Box sx={{
            display: "flex",
            justifyContent: "center",
            py: 1,
            position: "sticky",
            top: 0,
            zIndex: 10,
            backgroundColor: alpha(theme.palette.background.paper, 0.7),
            backdropFilter: "blur(4px)"
          }}>
            <CircularProgress size={24} thickness={4} />
          </Box>
        )}

        {!loading && !loadedAll && messages.length >= messagesLimit && (
          <Box sx={{
            display: "flex",
            justifyContent: "center",
            mb: 2
          }}>
            <Button
              variant="outlined"
              size="small"
              onClick={loadMoreMessages}
              disabled={loadingMore}
              sx={{
                borderRadius: 4,
                textTransform: "none",
                fontSize: "0.8rem"
              }}
            >
              {loadingMore ? "Se încarcă..." : "Încarcă mesaje mai vechi"}
            </Button>
          </Box>
        )}

        {loading ? (
          <Box sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            py: 4,
            flex: 1
          }}>
            <CircularProgress />
            <Typography sx={{ mt: 2, color: "text.secondary" }}>
              Se încarcă mesajele...
            </Typography>
          </Box>
        ) : error ? (
          <Typography color="error" sx={{ textAlign: "center", my: 2 }}>
            {error}
          </Typography>
        ) : messages.length > 0 ? (
          messages.map((message, index) => {
            // Check if this message is from the same sender as the previous one
            const prevMessage = index > 0 ? messages[index - 1] : null;
            const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
            const isGroupedWithPrev = prevMessage && prevMessage.senderId === message.senderId;
            const isGroupedWithNext = nextMessage && nextMessage.senderId === message.senderId;

            // Calculate time difference with the previous message
            const timeGap = prevMessage
              ? (message.createdAt - prevMessage.createdAt) > 5 * 60 * 1000 // 5 minutes
              : true;

            return (
              <Message
                key={message.id}
                message={message}
                isOwn={message.senderId === currentUser.uid}
                isMobile={isMobile}
                isGroupedWithPrev={isGroupedWithPrev && !timeGap}
                isGroupedWithNext={isGroupedWithNext}
                showAvatar={!isGroupedWithNext || !nextMessage}
              />
            );
          })
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center",
              color: "text.secondary",
              mt: 4,
              flex: 1
            }}
          >
            <LockIcon sx={{ fontSize: 40, mb: 2, opacity: 0.6 }} />
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {isSelfChat 
                ? "Notițele tale vor apărea aici" 
                : "Nicio conversație încă"}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, maxWidth: 300 }}>
              {isSelfChat 
                ? "Trimite un mesaj pentru a crea notițe personale criptate end-to-end" 
                : `Trimite primul mesaj pentru a începe o conversație criptată end-to-end cu ${selectedUser?.displayName}`}
            </Typography>
          </Box>
        )}

        {/* Referință pentru derulare automată */}
        <div ref={messagesEndRef} />
      </Box>

      <Divider />
      <Box
        sx={{
          position: isMobile ? "sticky" : "relative",
          bottom: 0,
          width: "100%",
          zIndex: 10,
          backgroundColor: "background.paper",
          boxShadow: isMobile ? "0px -2px 4px rgba(0,0,0,0.05)" : "none"
        }}
      >
        <MessageInput onSendMessage={handleSendMessage} isMobile={isMobile} />
      </Box>

      {/* Information Drawer */}
      <SwipeableDrawer
        anchor={isPortrait ? 'bottom' : 'right'}
        open={infoOpen}
        onClose={toggleInfoDrawer}
        onOpen={toggleInfoDrawer}
        disableSwipeToOpen
        PaperProps={{
          sx: {
            width: isPortrait ? '100%' : 320,
            maxHeight: isPortrait ? '70vh' : '100vh',
            borderTopLeftRadius: isPortrait ? 16 : 0,
            borderTopRightRadius: isPortrait ? 16 : 0,
            boxShadow: 15
          }
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
          <IconButton edge="start" onClick={toggleInfoDrawer} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>
            Detalii conversație
          </Typography>
        </Box>
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <Avatar
              src={selectedUser?.photoURL}
              alt={selectedUser?.displayName}
              sx={{ width: 80, height: 80, mb: 1.5 }}
            >
              {selectedUser?.displayName?.charAt(0) || "U"}
            </Avatar>
            <Typography variant="h6" align="center">
              {isSelfChat ? "Notițe personale" : selectedUser?.displayName}
            </Typography>
            {!isSelfChat && (
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                mt: 0.5,
                bgcolor: selectedUser?.online ? 'success.main' : 'text.disabled',
                color: 'white',
                px: 1.5,
                py: 0.3,
                borderRadius: 10,
                fontSize: '0.75rem'
              }}>
                {selectedUser?.online ? 'Online' : 'Offline'}
              </Box>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" color="primary" gutterBottom>
            Securitate
          </Typography>
          <Box sx={{
            bgcolor: alpha(theme.palette.success.light, 0.1),
            p: 2,
            borderRadius: 2,
            mb: 3,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1.5
          }}>
            <LockIcon color="success" />
            <Box>
              <Typography variant="body2" fontWeight={500}>
                {isSelfChat 
                  ? "Mesajele sunt criptate end-to-end" 
                  : "Mesajele sunt criptate end-to-end"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {isSelfChat 
                  ? "Doar tu poți citi aceste notițe." 
                  : "Nimeni nu poate citi mesajele voastre în afară de voi, nici măcar noi."}
              </Typography>
            </Box>
          </Box>

          {!isSelfChat && (
            <>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Detalii utilizator
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Email
                </Typography>
                <Typography variant="body2">
                  {selectedUser?.email || 'Nedisponibil'}
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Ultima activitate
                </Typography>
                <Typography variant="body2">
                  {selectedUser?.lastActive ? formatDate(selectedUser.lastActive.toDate ? selectedUser.lastActive.toDate() : selectedUser.lastActive) : 'Necunoscut'}
                </Typography>
              </Box>
            </>
          )}

          <Typography variant="subtitle2" color="primary" gutterBottom>
            Conversație
          </Typography>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Număr mesaje
            </Typography>
            <Typography variant="body2">
              {messages.length} mesaje
            </Typography>
          </Box>
        </Box>
      </SwipeableDrawer>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Paper>
  );
};

export default Chat;