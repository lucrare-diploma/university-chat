// src/components/Chat.js
import { getDoc, doc } from 'firebase/firestore';
import { getChatEncryptionKey, generateGroupChatId } from '../utils/encryption';
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from 'react-router-dom';
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
  setDoc,
  writeBatch
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import Message from "./Message";
import MessageInput from "./MessageInput";
import { encryptMessage, decryptMessage, generateChatKey } from "../utils/encryption";
import { getAISuggestions, isAIAvailable, getLocalSuggestions } from "../utils/aiSuggestions";

const Chat = () => {
  // Routing hooks
  const { userId, groupId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // State pentru date utilizator/grup
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingUserData, setLoadingUserData] = useState(true);
  const [userDataError, setUserDataError] = useState(null);

  // State pentru mesaje și funcționalități existente
  const [messages, setMessages] = useState([]);
  const [decryptedMessages, setDecryptedMessages] = useState([]);
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
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const prevScrollHeightRef = useRef(0);
  const theme = useTheme();
  
  // Media queries pentru diferite dimensiuni de ecran
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isExtraSmall = useMediaQuery(theme.breakpoints.down('xs'));
  const isVerySmall = useMediaQuery('(max-width:380px)');
  const isPortrait = useMediaQuery('(orientation: portrait)');
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  // Încărcare date utilizator/grup bazat pe parametrii URL
  useEffect(() => {
    const loadChatData = async () => {
      if (!currentUser) {
        navigate('/auth');
        return;
      }

      setLoadingUserData(true);
      setUserDataError(null);

      try {
        if (userId) {
          // Încarcă datele utilizatorului pentru chat individual
          console.log("Încărcare date utilizator pentru chat:", userId);
          
          if (userId === currentUser.uid) {
            // Chat cu sine însuși
            setSelectedUser({
              id: currentUser.uid,
              displayName: currentUser.displayName,
              email: currentUser.email,
              photoURL: currentUser.photoURL,
              online: true,
              type: 'user',
              isSelf: true
            });
          } else {
            // Chat cu alt utilizator
            const userDoc = await getDoc(doc(db, "users", userId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              setSelectedUser({
                id: userId,
                ...userData,
                type: 'user',
                isSelf: false
              });
            } else {
              setUserDataError("Utilizatorul nu a fost găsit");
              return;
            }
          }
        } else if (groupId) {
          // Încarcă datele grupului
          console.log("Încărcare date grup pentru chat:", groupId);
          const groupDoc = await getDoc(doc(db, "groups", groupId));
          if (groupDoc.exists()) {
            const groupData = groupDoc.data();
            
            // Verifică dacă utilizatorul curent este membru al grupului
            if (!groupData.members?.includes(currentUser.uid)) {
              setUserDataError("Nu ești membru al acestui grup");
              return;
            }
            
            setSelectedUser({
              id: groupId,
              ...groupData,
              type: 'group'
            });
          } else {
            setUserDataError("Grupul nu a fost găsit");
            return;
          }
        } else {
          setUserDataError("ID invalid pentru chat");
          return;
        }
      } catch (error) {
        console.error("Eroare la încărcarea datelor chat:", error);
        setUserDataError("Eroare la încărcarea datelor: " + error.message);
      } finally {
        setLoadingUserData(false);
      }
    };

    loadChatData();
  }, [userId, groupId, currentUser, navigate]);

  // Verifică dacă utilizatorul actual este într-o conversație cu sine
  const isSelfChat = selectedUser?.isSelf || selectedUser?.id === currentUser?.uid;

  // Generează ID-ul conversației - sortează ID-urile utilizatorilor pentru consistență
  const getChatId = useCallback(() => {
    if (!selectedUser) return '';
    
    // Pentru grupuri
    if (selectedUser.type === 'group') {
      return generateGroupChatId(selectedUser.id);
    }
    
    // Pentru chat cu sine
    if (isSelfChat) {
      return `self_${currentUser.uid}`;
    }
    
    // Pentru chat-ul normal între doi utilizatori
    const ids = [currentUser.uid, selectedUser.id].sort();
    return `${ids[0]}_${ids[1]}`;
  }, [currentUser, selectedUser, isSelfChat]);

  // Generate encryption key for this chat when users are selected
  useEffect(() => {
    const generateChatKey = async () => {
      if (currentUser && selectedUser && !loadingUserData) {
        try {
          let key;
          if (selectedUser.type === 'group') {
            // Pentru grupuri, obținem cheia din baza de date
            key = await getChatEncryptionKey(
              getChatId(), 
              'group', 
              selectedUser.id
            );
          } else {
            // Pentru DM-uri, folosim sistemul existent
            key = await getChatEncryptionKey(getChatId(), 'dm');
          }
          setChatKey(key);
          console.log("Cheia de criptare a fost generată pentru conversație");
        } catch (error) {
          console.error("Eroare la generarea cheii de criptare:", error);
          setError("Nu s-a putut stabili criptarea pentru această conversație");
        }
      }
    };
  
    generateChatKey();
  }, [currentUser, selectedUser, getChatId, loadingUserData]);

  // Verifică dacă utilizatorul are activată funcționalitatea AI
  useEffect(() => {
    const fetchUserPreferences = async () => {
      if (currentUser) {
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            // Verificăm setarea aiEnabled (dacă există)
            if (userData.aiEnabled !== undefined) {
              setAiEnabled(userData.aiEnabled);
            }
          }
        } catch (error) {
          console.error("Eroare la obținerea preferințelor de AI:", error);
        }
      }
    };
    
    fetchUserPreferences();
  }, [currentUser]);

  // Funcție pentru a derula la ultimul mesaj
  const scrollToBottom = (behavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Handle navigation back
  const handleBack = () => {
    navigate('/', { replace: true });
  };

  // Setup swipe gesture handlers (for mobile back navigation)
  const handleTouchStart = (e) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
  };

  const handleTouchEnd = (e) => {
    if (!touchStart) return;

    const xDiff = touchStart.x - e.changedTouches[0].clientX;
    const yDiff = touchStart.y - e.changedTouches[0].clientY;

    // Only register horizontal swipes that are more significant than vertical
    if (Math.abs(xDiff) > Math.abs(yDiff) && Math.abs(xDiff) > 70) {
      if (xDiff < 0) { // Swiped right
        handleBack();
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
      setDecryptedMessages(messagesList);
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
    if (!selectedUser || !currentUser || !chatKey || loadingUserData) return;

    setLoading(true);
    setError(null);

    try {
      console.log("Încărcare mesaje pentru conversația:", getChatId());
      const chatId = getChatId();

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
        const decryptedList = [];

        snapshot.forEach((doc) => {
          const messageData = doc.data();
          // Verific dacă createdAt există și este un timestamp valid
          const createdAt = messageData.createdAt ?
            (messageData.createdAt.toDate ? messageData.createdAt.toDate() : messageData.createdAt)
            : new Date();

          // Decrypt the message text if it's encrypted
          let decryptedText = messageData.text;
          try {
            if (messageData.encrypted) {
              decryptedText = decryptMessage(messageData.text, chatKey);
            }
          } catch (error) {
            console.error("Eroare la decriptarea mesajului:", error);
            decryptedText = "[Mesaj criptat - nu poate fi decriptat]";
          }

          const messageObj = {
            id: doc.id,
            ...messageData,
            text: messageData.text, // Text criptat
            createdAt
          };

          const decryptedObj = {
            ...messageObj,
            text: decryptedText, // Text decriptat
            isOwn: messageData.senderId === currentUser.uid
          };

          messagesList.push(messageObj);
          decryptedList.push(decryptedObj);
        });

        console.log("Mesaje procesate:", messagesList.length);
        setMessages(messagesList);
        setDecryptedMessages(decryptedList);
        setLoading(false);
        setLoadedAll(messagesList.length < messagesLimit);

        // Derulează la ultimul mesaj după ce se încarcă
        setTimeout(scrollToBottom, 100);
        
        // Obține sugestii AI bazate pe mesajele decriptate
        if (decryptedList.length > 0 && aiEnabled) {
          generateAISuggestions(chatId, decryptedList);
        }
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
  }, [currentUser, selectedUser, getChatId, chatKey, messagesLimit, loadingUserData]);

  // Generează sugestii de la API-ul AI
  const generateAISuggestions = async (chatId, messages) => {
    // Nu generăm sugestii pentru conversațiile cu sine
    if (isSelfChat || !aiEnabled) {
      setAiSuggestions([]);
      return;
    }
    
    // Verifică dacă există mesaje și dacă ultimul mesaj nu este de la utilizatorul curent
    if (messages.length === 0 || messages[messages.length - 1].senderId === currentUser.uid) {
      setAiSuggestions([]);
      return;
    }
    
    try {
      setLoadingSuggestions(true);
      
      // Verifică disponibilitatea API-ului AI
      let suggestions = [];
      if (isAIAvailable()) {
        suggestions = await getAISuggestions(chatId, currentUser.uid, messages);
      } else {
        console.log("API-ul AI nu este disponibil, se folosesc sugestii locale");
        suggestions = getLocalSuggestions(messages);
      }
      
      setAiSuggestions(suggestions);
    } catch (error) {
      console.error("Eroare la generarea sugestiilor AI:", error);
      setAiSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Marcarea mesajelor ca fiind citite când se deschide conversația
  useEffect(() => {
    const markMessagesAsRead = async () => {
      if (!selectedUser || !currentUser || loadingUserData) return;
      
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
  }, [currentUser, selectedUser, getChatId, isSelfChat, loadingUserData]);

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

  // Când un utilizator selectează o sugestie, o eliminăm din lista de sugestii
  const handleSuggestionUsed = (suggestion) => {
    setAiSuggestions(currentSuggestions => 
      currentSuggestions.filter(s => s !== suggestion)
    );
  };

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

      // Determinăm receiverId bazat pe tipul de chat
      let receiverId;
      if (selectedUser.type === 'group') {
        receiverId = selectedUser.id; // Pentru grupuri, receiverId este ID-ul grupului
      } else if (isSelfChat) {
        receiverId = currentUser.uid; // Pentru chat cu sine
      } else {
        receiverId = selectedUser.id; // Pentru chat individual
      }

      // Adaugă mesajul în colecția de mesaje
      await addDoc(collection(db, "messages"), {
        text: encryptedText,
        encrypted: true, // Flag that indicates this message is encrypted
        senderId: currentUser.uid,
        receiverId: receiverId,
        senderName: currentUser.displayName || "Utilizator",
        senderPhoto: currentUser.photoURL,
        chatId,
        createdAt: serverTimestamp(),
        read: isSelfChat, // Marcăm deja ca citit dacă este chat cu sine
        delivered: true // Marcăm mesajul ca livrat
      });

      // Incrementează contorul de mesaje necitite pentru destinatar doar dacă nu e chat cu sine și nu e grup
      if (!isSelfChat && selectedUser.type !== 'group') {
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
      
      // Resetăm sugestiile după ce utilizatorul trimite un mesaj
      setAiSuggestions([]);
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

  // Loading state pentru încărcarea datelor utilizatorului/grupului
  if (loadingUserData) {
    return (
      <Box sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        p: 3,
        gap: 2,
      }}>
        <CircularProgress size={40} />
        <Typography variant="body1" color="text.secondary">
          {userId ? "Se încarcă utilizatorul..." : "Se încarcă grupul..."}
        </Typography>
      </Box>
    );
  }

  // Error state pentru datele utilizatorului/grupului
  if (userDataError) {
    return (
      <Box sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        p: 3,
        gap: 2,
        textAlign: "center"
      }}>
        <Typography variant="h6" color="error" gutterBottom>
          {userDataError}
        </Typography>
        <Button
          variant="contained"
          onClick={handleBack}
          startIcon={<ArrowBackIcon />}
        >
          Înapoi la conversații
        </Button>
      </Box>
    );
  }

  if (!selectedUser) {
    return null;
  }

  const badgeStatus = selectedUser?.online ? "success" : "default";

  // Text pentru titlul conversației
  const chatTitle = isSelfChat 
    ? "Notițe personale" 
    : selectedUser?.type === 'group' 
      ? selectedUser?.name 
      : selectedUser?.displayName;

  // Ajustări responsiv pentru înălțimea containerului de mesaje
  const getMessageContainerHeight = () => {
    if (isVerySmall) return "calc(100% - 110px)";
    if (isExtraSmall) return "calc(100% - 120px)";
    if (isMobile) return "calc(100% - 130px)";
    if (isTablet) return "calc(100% - 140px)";
    return "calc(100% - 150px)";
  };

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
          backgroundColor: isSelfChat ? "success.dark" : selectedUser?.type === 'group' ? "secondary.dark" : "primary.dark",
          borderBottom: 1,
          borderColor: "divider",
          zIndex: 10,
          top: 0,
          minHeight: isVerySmall ? 48 : (isMobile ? 56 : 64),
        }}
      >
        <Toolbar 
          sx={{ 
            minHeight: isVerySmall ? 48 : (isMobile ? 56 : 64),
            p: isVerySmall ? 0.5 : (isMobile ? 1 : 2),
          }}
        >
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleBack}
            sx={{
              mr: isVerySmall ? 0.5 : (isMobile ? 1 : 2),
              transition: "all 0.2s",
              color: "white",
              padding: isVerySmall ? '4px' : undefined,
              "&:hover": {
                backgroundColor: alpha("#ffffff", 0.1)
              }
            }}
            aria-label="înapoi"
            size={isVerySmall ? "small" : "medium"}
          >
            <ArrowBackIcon fontSize={isVerySmall ? "small" : "medium"} />
          </IconButton>
          
          {selectedUser?.type !== 'group' && (
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              variant="dot"
              color={badgeStatus}
              sx={{
                "& .MuiBadge-badge": {
                  boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
                  width: isVerySmall ? 8 : 12,
                  height: isVerySmall ? 8 : 12,
                  borderRadius: '50%'
                }
              }}
            >
              <Avatar
                src={selectedUser?.photoURL}
                alt={selectedUser?.displayName}
                sx={{
                  mr: isVerySmall ? 1 : 2,
                  width: isVerySmall ? 32 : (isMobile ? 36 : 48),
                  height: isVerySmall ? 32 : (isMobile ? 36 : 48),
                  cursor: "pointer",
                  transition: "transform 0.2s ease",
                  "&:hover": {
                    transform: "scale(1.05)"
                  }
                }}
                onClick={toggleInfoDrawer}
              >
                {selectedUser?.displayName?.charAt(0) || selectedUser?.name?.charAt(0) || "U"}
              </Avatar>
            </Badge>
          )}
          
          {selectedUser?.type === 'group' && (
            <Avatar
              sx={{
                mr: isVerySmall ? 1 : 2,
                width: isVerySmall ? 32 : (isMobile ? 36 : 48),
                height: isVerySmall ? 32 : (isMobile ? 36 : 48),
                cursor: "pointer",
                transition: "transform 0.2s ease",
                bgcolor: "secondary.main",
                "&:hover": {
                  transform: "scale(1.05)"
                }
              }}
              onClick={toggleInfoDrawer}
            >
              {selectedUser?.name?.charAt(0) || "G"}
            </Avatar>
          )}
          
          <Box
            sx={{
              flexGrow: 1,
              cursor: "pointer",
              overflow: "hidden",
              "&:hover": {
                opacity: 0.8
              }
            }}
            onClick={toggleInfoDrawer}
          >
            <Typography
              variant={isVerySmall ? "body1" : (isMobile ? "h6" : "h6")}
              sx={{
                fontSize: isVerySmall ? "0.9rem" : (isMobile ? "1rem" : "1.25rem"),
                fontWeight: 500,
                color: "white",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
            >
              {chatTitle}
            </Typography>
            <Typography
              variant="body2"
              color="white"
              sx={{
                fontSize: isVerySmall ? "0.65rem" : (isMobile ? "0.75rem" : "0.875rem"),
                display: "flex",
                alignItems: "center",
                opacity: 0.85
              }}
            >
              {selectedUser?.type === 'group' && (
                <>
                  <Box
                    sx={{
                      width: isVerySmall ? 6 : 8,
                      height: isVerySmall ? 6 : 8,
                      borderRadius: "50%",
                      bgcolor: "success.main",
                      mr: 0.5,
                      display: "inline-block"
                    }}
                  />
                  {selectedUser?.members?.length || 0} membri
                </>
              )}
              {selectedUser?.type !== 'group' && (
                <>
                  <Box
                    sx={{
                      width: isVerySmall ? 6 : 8,
                      height: isVerySmall ? 6 : 8,
                      borderRadius: "50%",
                      bgcolor: selectedUser?.online ? "success.main" : "text.disabled",
                      mr: 0.5,
                      display: "inline-block"
                    }}
                  />
                  {isSelfChat 
                    ? (isVerySmall ? "Privat" : "Doar tu poți vedea aceste mesaje") 
                    : selectedUser?.online ? "Online" : "Offline"}
                </>
              )}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title="Mesaje criptate end-to-end">
              <LockIcon
                fontSize={isVerySmall ? "small" : "small"}
                sx={{
                  mr: isVerySmall ? 0.5 : 1,
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
              size={isVerySmall ? "small" : "medium"}
            >
              <MoreVertIcon fontSize={isVerySmall ? "small" : "medium"} />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              PaperProps={{
                elevation: 3,
                sx: { minWidth: isVerySmall ? 160 : 200 }
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
            py: isVerySmall ? 0.25 : 0.5,
            zIndex: 5,
            bgcolor: alpha(theme.palette.success.light, 0.1)
          }}>
            <Tooltip title="Mesajele sunt criptate end-to-end">
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                fontSize: isVerySmall ? '0.6rem' : (isMobile ? '0.7rem' : '0.8rem'),
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
                <LockIcon 
                  sx={{ 
                    fontSize: isVerySmall ? '0.6rem' : (isMobile ? '0.7rem' : '0.8rem'), 
                    mr: 0.5 
                  }} 
                />
                {isVerySmall 
                  ? (isSelfChat ? "Privat" : selectedUser?.type === 'group' ? "Criptat" : "Criptat") 
                  : (isSelfChat ? "Conversație privată" : selectedUser?.type === 'group' ? "Grup criptat" : "Conversație criptată")
                }
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
          p: isVerySmall ? 0.75 : (isMobile ? 1.5 : 2),
          display: "flex",
          flexDirection: "column",
          bgcolor: theme.palette.background.default,
          mt: isVerySmall ? 2 : 3,
          position: "relative",
          height: getMessageContainerHeight(),
          WebkitOverflowScrolling: "touch",
        }}
        onScroll={handleScroll}
      >
        {loadingMore && (
          <Box sx={{
            display: "flex",
            justifyContent: "center",
            py: isVerySmall ? 0.5 : 1,
            position: "sticky",
            top: 0,
            zIndex: 10,
            backgroundColor: alpha(theme.palette.background.paper, 0.7),
            backdropFilter: "blur(4px)"
          }}>
            <CircularProgress size={isVerySmall ? 20 : 24} thickness={4} />
          </Box>
        )}

        {!loading && !loadedAll && messages.length >= messagesLimit && (
          <Box sx={{
            display: "flex",
            justifyContent: "center",
            mb: isVerySmall ? 1 : 2
          }}>
            <Button
              variant="outlined"
              size={isVerySmall ? "small" : "small"}
              onClick={loadMoreMessages}
              disabled={loadingMore}
              sx={{
                borderRadius: 4,
                textTransform: "none",
                fontSize: isVerySmall ? "0.7rem" : "0.8rem",
                py: isVerySmall ? 0.25 : 0.5
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
            <CircularProgress size={isVerySmall ? 28 : 36} />
            <Typography 
              sx={{ 
                mt: 2, 
                color: "text.secondary", 
                fontSize: isVerySmall ? "0.8rem" : "1rem" 
              }}
            >
              Se încarcă mesajele...
            </Typography>
          </Box>
        ) : error ? (
          <Typography 
            color="error" 
            sx={{ 
              textAlign: "center", 
              my: 2, 
              fontSize: isVerySmall ? "0.8rem" : "0.9rem" 
            }}
          >
            {error}
          </Typography>
        ) : decryptedMessages.length > 0 ? (
          decryptedMessages.map((message, index) => {
            // Verificăm dacă acest mesaj este de la același expeditor ca precedentul
            const prevMessage = index > 0 ? decryptedMessages[index - 1] : null;
            const nextMessage = index < decryptedMessages.length - 1 ? decryptedMessages[index + 1] : null;
            const isGroupedWithPrev = prevMessage && prevMessage.senderId === message.senderId;
            const isGroupedWithNext = nextMessage && nextMessage.senderId === message.senderId;

            // Calculăm diferența de timp față de mesajul anterior
            const timeGap = prevMessage
              ? (message.createdAt - prevMessage.createdAt) > 5 * 60 * 1000 // 5 minute
              : true;

            return (
              <Message
                key={message.id}
                message={message}
                isOwn={message.senderId === currentUser.uid}
                isMobile={isMobile || isTablet || isExtraSmall || isVerySmall}
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
            <LockIcon 
              sx={{ 
                fontSize: isVerySmall ? 28 : (isMobile ? 32 : 40), 
                mb: 2, 
                opacity: 0.6 
              }} 
            />
            <Typography 
              variant="body1" 
              sx={{ 
                fontWeight: 500, 
                fontSize: isVerySmall ? "0.9rem" : "1rem" 
              }}
            >
              {isSelfChat 
                ? "Notițele tale vor apărea aici" 
                : selectedUser?.type === 'group'
                  ? "Niciun mesaj în grup încă"
                  : "Nicio conversație încă"}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                mt: 1, 
                maxWidth: 300, 
                fontSize: isVerySmall ? "0.75rem" : "0.85rem",
                px: isVerySmall ? 2 : 0
              }}
            >
              {isSelfChat 
                ? "Trimite un mesaj pentru a crea notițe personale criptate end-to-end" 
                : selectedUser?.type === 'group'
                  ? `Trimite primul mesaj în grupul "${selectedUser?.name}"`
                  : `Trimite primul mesaj pentru a începe o conversație criptată cu ${selectedUser?.displayName}`}
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
        <MessageInput 
          onSendMessage={handleSendMessage} 
          isMobile={isMobile || isExtraSmall || isVerySmall}
          aiSuggestions={aiSuggestions}
          loadingSuggestions={loadingSuggestions}
          onSuggestionUsed={handleSuggestionUsed}
        />
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
            width: isPortrait 
              ? '100%' 
              : (isVerySmall ? 260 : (isMobile ? 280 : 320)),
            maxHeight: isPortrait 
              ? (isVerySmall ? '85vh' : '70vh') 
              : '100vh',
            borderTopLeftRadius: isPortrait ? 16 : 0,
            borderTopRightRadius: isPortrait ? 16 : 0,
            boxShadow: 15
          }
        }}
      >
        <Box 
          sx={{ 
            p: isVerySmall ? 1 : 2, 
            display: 'flex', 
            alignItems: 'center', 
            borderBottom: 1, 
            borderColor: 'divider' 
          }}
        >
          <IconButton 
            edge="start" 
            onClick={toggleInfoDrawer} 
            sx={{ mr: isVerySmall ? 1 : 2 }}
            size={isVerySmall ? "small" : "medium"}
          >
            <ArrowBackIcon fontSize={isVerySmall ? "small" : "medium"} />
          </IconButton>
          <Typography 
            variant={isVerySmall ? "subtitle1" : "h6"} 
            sx={{ fontSize: isVerySmall ? '0.9rem' : '1.1rem' }}
          >
            Detalii conversație
          </Typography>
        </Box>
        <Box sx={{ p: isVerySmall ? 1.5 : 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <Avatar
              src={selectedUser?.photoURL}
              alt={selectedUser?.displayName || selectedUser?.name}
              sx={{ 
                width: isVerySmall ? 64 : 80, 
                height: isVerySmall ? 64 : 80, 
                mb: 1.5,
                bgcolor: selectedUser?.type === 'group' ? 'secondary.main' : 'primary.main'
              }}
            >
              {(selectedUser?.displayName?.charAt(0) || selectedUser?.name?.charAt(0) || "U")}
            </Avatar>
            <Typography 
              variant={isVerySmall ? "subtitle1" : "h6"} 
              align="center"
              sx={{ fontSize: isVerySmall ? '1rem' : '1.25rem' }}
            >
              {chatTitle}
            </Typography>
            {selectedUser?.type === 'group' && (
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                mt: 0.5,
                bgcolor: 'secondary.main',
                color: 'white',
                px: 1.5,
                py: 0.3,
                borderRadius: 10,
                fontSize: isVerySmall ? '0.65rem' : '0.75rem'
              }}>
                Grup · {selectedUser?.members?.length || 0} membri
              </Box>
            )}
            {selectedUser?.type !== 'group' && !isSelfChat && (
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                mt: 0.5,
                bgcolor: selectedUser?.online ? 'success.main' : 'text.disabled',
                color: 'white',
                px: 1.5,
                py: 0.3,
                borderRadius: 10,
                fontSize: isVerySmall ? '0.65rem' : '0.75rem'
              }}>
                {selectedUser?.online ? 'Online' : 'Offline'}
              </Box>
            )}
          </Box>

          <Divider sx={{ my: isVerySmall ? 1 : 2 }} />

          <Typography 
            variant={isVerySmall ? "caption" : "subtitle2"} 
            color="primary" 
            gutterBottom
          >
            Securitate
          </Typography>
          <Box sx={{
            bgcolor: alpha(theme.palette.success.light, 0.1),
            p: isVerySmall ? 1 : 2,
            borderRadius: 2,
            mb: isVerySmall ? 2 : 3,
            display: 'flex',
            alignItems: 'flex-start',
            gap: isVerySmall ? 1 : 1.5
          }}>
            <LockIcon color="success" fontSize={isVerySmall ? "small" : "medium"} />
            <Box>
              <Typography 
                variant={isVerySmall ? "caption" : "body2"} 
                fontWeight={500}
              >
                Mesajele sunt criptate end-to-end
              </Typography>
              <Typography 
                variant={isVerySmall ? "caption" : "caption"} 
                color="text.secondary"
                sx={{ fontSize: isVerySmall ? '0.65rem' : '0.75rem' }}
              >
                {isSelfChat 
                  ? "Doar tu poți citi aceste notițe." 
                  : selectedUser?.type === 'group'
                    ? "Doar membrii grupului pot citi mesajele."
                    : "Nimeni nu poate citi mesajele voastre în afară de voi, nici măcar noi."}
              </Typography>
            </Box>
          </Box>

          {selectedUser?.type === 'group' && (
            <>
              <Typography 
                variant={isVerySmall ? "caption" : "subtitle2"} 
                color="primary" 
                gutterBottom
              >
                Detalii grup
              </Typography>
              <Box sx={{ mb: isVerySmall ? 1 : 2 }}>
                <Typography 
                  variant={isVerySmall ? "caption" : "body2"} 
                  color="text.secondary" 
                  gutterBottom
                >
                  Cod grup
                </Typography>
                <Typography 
                  variant={isVerySmall ? "caption" : "body2"}
                  sx={{ fontSize: isVerySmall ? '0.7rem' : 'inherit', fontFamily: 'monospace' }}
                >
                  {selectedUser?.code || 'Necunoscut'}
                </Typography>
              </Box>
              <Box sx={{ mb: isVerySmall ? 1 : 2 }}>
                <Typography 
                  variant={isVerySmall ? "caption" : "body2"} 
                  color="text.secondary" 
                  gutterBottom
                >
                  Descriere
                </Typography>
                <Typography 
                  variant={isVerySmall ? "caption" : "body2"}
                  sx={{ fontSize: isVerySmall ? '0.7rem' : 'inherit' }}
                >
                  {selectedUser?.description || 'Fără descriere'}
                </Typography>
              </Box>
            </>
          )}

          {!isSelfChat && selectedUser?.type !== 'group' && (
            <>
              <Typography 
                variant={isVerySmall ? "caption" : "subtitle2"} 
                color="primary" 
                gutterBottom
              >
                Detalii utilizator
              </Typography>
              <Box sx={{ mb: isVerySmall ? 1 : 2 }}>
                <Typography 
                  variant={isVerySmall ? "caption" : "body2"} 
                  color="text.secondary" 
                  gutterBottom
                >
                  Email
                </Typography>
                <Typography 
                  variant={isVerySmall ? "caption" : "body2"}
                  sx={{ fontSize: isVerySmall ? '0.7rem' : 'inherit' }}
                >
                  {selectedUser?.email || 'Nedisponibil'}
                </Typography>
              </Box>

              <Box sx={{ mb: isVerySmall ? 2 : 3 }}>
                <Typography 
                  variant={isVerySmall ? "caption" : "body2"} 
                  color="text.secondary" 
                  gutterBottom
                >
                  Ultima activitate
                </Typography>
                <Typography 
                  variant={isVerySmall ? "caption" : "body2"}
                  sx={{ fontSize: isVerySmall ? '0.7rem' : 'inherit' }}
                >
                  {selectedUser?.lastActive ? formatDate(selectedUser.lastActive.toDate ? selectedUser.lastActive.toDate() : selectedUser.lastActive) : 'Necunoscut'}
                </Typography>
              </Box>
            </>
          )}

          <Typography 
            variant={isVerySmall ? "caption" : "subtitle2"} 
            color="primary" 
            gutterBottom
          >
            Conversație
          </Typography>
          <Box sx={{ mb: isVerySmall ? 2 : 3 }}>
            <Typography 
              variant={isVerySmall ? "caption" : "body2"} 
              color="text.secondary" 
              gutterBottom
            >
              Număr mesaje
            </Typography>
            <Typography 
              variant={isVerySmall ? "caption" : "body2"}
              sx={{ fontSize: isVerySmall ? '0.7rem' : 'inherit' }}
            >
              {decryptedMessages.length} mesaje
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
        anchorOrigin={{ 
          vertical: 'bottom', 
          horizontal: 'center' 
        }}
        sx={{
          '& .MuiSnackbarContent-root': {
            fontSize: isVerySmall ? '0.75rem' : '0.875rem',
          }
        }}
      />
    </Paper>
  );
};

export default Chat;