import React, { useState, useEffect, useRef } from "react";
import {
  List,
  Typography,
  Box,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
  InputBase,
  IconButton,
  alpha,
  Fade,
  Zoom,
  Chip,
  Tooltip,
  Button,
  Collapse
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearIcon from "@mui/icons-material/Clear";
import PersonIcon from "@mui/icons-material/Person";
import PeopleIcon from "@mui/icons-material/People";
import { collection, query, getDocs, onSnapshot, doc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import UserItem from "./UserItem";

const UserList = ({ setSelectedUser }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all"); // "all", "online", "offline"
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const searchInputRef = useRef(null);
  
  const { currentUser } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));

  // Focus search input with keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Monitor unread messages for current user
  useEffect(() => {
    if (!currentUser) return;
    
    try {
      console.log("Monitorizez mesajele necitite...");
      const unreadCountsRef = doc(db, "userUnreadCounts", currentUser.uid);
      
      const unsubscribe = onSnapshot(unreadCountsRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          console.log("Date mesaje necitite actualizate:", data);
          setUnreadCounts(data);
        } else {
          // Document doesn't exist yet
          console.log("Nu există încă un document de mesaje necitite");
          setUnreadCounts({});
        }
      }, (error) => {
        console.error("Eroare la monitorizarea mesajelor necitite:", error);
      });
      
      return () => unsubscribe();
    } catch (error) {
      console.error("Eroare la configurarea monitorului pentru mesaje necitite:", error);
    }
  }, [currentUser]);

  // Update users with unread counts
  useEffect(() => {
    if (Object.keys(unreadCounts).length === 0 || users.length === 0) return;
    
    const updatedUsers = users.map(user => ({
      ...user,
      unreadCount: unreadCounts[user.id] || 0
    }));
    
    setUsers(updatedUsers);
    applyFilters(updatedUsers, searchTerm, filter);
  }, [unreadCounts]);

  useEffect(() => {
    if (!currentUser) return;

    console.log("Încercare de încărcare a utilizatorilor...");
    
    try {
      // Folosim onSnapshot pentru a obține actualizări în timp real
      const usersCollection = collection(db, "users");
      const q = query(usersCollection);
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        console.log("Snapshot primit, număr documente:", querySnapshot.size);
        
        const usersList = [];
        
        // Adaugă utilizatorul curent la listă
        querySnapshot.forEach((doc) => {
          const userData = doc.data();
          
          // Adaugă și utilizatorul curent și îl marchează corespunzător
          const isCurrentUser = doc.id === currentUser.uid;
          usersList.push({
            id: doc.id,
            ...userData,
            unreadCount: unreadCounts[doc.id] || 0,
            isCurrentUser: isCurrentUser,  // Marchează utilizatorul curent
            displayName: isCurrentUser ? `${userData.displayName || currentUser.displayName} (Tu)` : userData.displayName || "Utilizator"
          });
        });
        
        console.log("Lista de utilizatori actualizată:", usersList);
        setUsers(usersList);
        applyFilters(usersList, searchTerm, filter);
        setLoading(false);
      }, (err) => {
        console.error("Eroare la ascultarea documentelor:", err);
        setError("Nu s-au putut încărca utilizatorii: " + err.message);
        setLoading(false);
      });
      
      return () => unsubscribe();
    } catch (error) {
      console.error("Eroare la configurarea listener-ului:", error);
      setError("Eroare la configurarea încărcării utilizatorilor: " + error.message);
      setLoading(false);
    }
  }, [currentUser, unreadCounts]);

  // Apply filters when search term or filter changes
  const applyFilters = (usersList, search, statusFilter) => {
    let result = [...usersList];
    
    // Apply search filter
    if (search.trim() !== "") {
      result = result.filter(user => 
        user.displayName && user.displayName.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter === "online") {
      result = result.filter(user => user.online);
    } else if (statusFilter === "offline") {
      result = result.filter(user => !user.online);
    }
    
    // Sort users with unread messages first, then by online status, but place current user at the top
    result.sort((a, b) => {
      // First sort current user to the top
      if (a.isCurrentUser) return -1;
      if (b.isCurrentUser) return 1;
      
      // Then sort by unread count (descending)
      if ((a.unreadCount || 0) > (b.unreadCount || 0)) return -1;
      if ((a.unreadCount || 0) < (b.unreadCount || 0)) return 1;
      
      // Then sort by online status
      if (a.online && !b.online) return -1;
      if (!a.online && b.online) return 1;
      
      // Then sort alphabetically
      return a.displayName?.localeCompare(b.displayName || "");
    });
    
    setFilteredUsers(result);
  };

  useEffect(() => {
    applyFilters(users, searchTerm, filter);
  }, [searchTerm, filter, users]);

  const refreshUsers = async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    setError(null);
    
    try {
      const usersCollection = collection(db, "users");
      const querySnapshot = await getDocs(query(usersCollection));
      
      console.log("Reîncărcare manuală, număr documente:", querySnapshot.size);
      
      const usersList = [];
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        
        // Adaugă și utilizatorul curent și îl marchează corespunzător
        const isCurrentUser = doc.id === currentUser.uid;
        usersList.push({
          id: doc.id,
          ...userData,
          unreadCount: unreadCounts[doc.id] || 0,
          isCurrentUser: isCurrentUser,  // Marchează utilizatorul curent
          displayName: isCurrentUser ? `${userData.displayName || currentUser.displayName} (Tu)` : userData.displayName || "Utilizator"
        });
      });
      
      setUsers(usersList);
      applyFilters(usersList, searchTerm, filter);
    } catch (error) {
      console.error("Eroare la reîncărcarea utilizatorilor:", error);
      setError("Eroare la reîncărcarea listei: " + error.message);
    } finally {
      setTimeout(() => setRefreshing(false), 600); // Show loading for at least 600ms
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
    searchInputRef.current?.focus();
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    if (isMobile) {
      setShowFilters(false);
    }
  };

  // Count online users
  const onlineCount = users.filter(user => user.online).length;

  // Count total unread messages
  const totalUnread = Object.values(unreadCounts).reduce((total, count) => total + count, 0);

  if (loading) {
    return (
      <Box sx={{ 
        display: "flex", 
        flexDirection: "column",
        justifyContent: "center", 
        alignItems: "center",
        p: 3, 
        height: "100%" 
      }}>
        <CircularProgress size={40} thickness={4} color="primary" />
        <Typography variant="body2" sx={{ mt: 2, color: "text.secondary" }}>
          Se încarcă utilizatorii...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      height: "100%", 
      display: "flex", 
      flexDirection: "column",
      overflow: "hidden",
      maxHeight: "100%"
    }}>
      <Box sx={{ 
        p: 2, 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        borderBottom: 1,
        borderColor: "divider",
        bgcolor: alpha(theme.palette.primary.light, 0.1)
      }}>
        <Box>
          <Typography 
            variant="h6" 
            sx={{ 
              fontSize: isMobile ? "1.1rem" : "1.25rem",
              fontWeight: 600,
              color: "primary.main",
              display: "flex",
              alignItems: "center"
            }}
          >
            Utilizatori
            <Chip 
              label={`${onlineCount} online`}
              color="success"
              size="small"
              variant="outlined"
              sx={{ ml: 1, fontSize: '0.7rem', height: 20 }}
            />
            {totalUnread > 0 && (
              <Chip
                label={`${totalUnread} necitite`}
                color="primary"
                size="small"
                variant="filled"
                sx={{ 
                  ml: 1, 
                  fontSize: '0.7rem', 
                  height: 20,
                  fontWeight: 'bold'
                }}
              />
            )}
          </Typography>
        </Box>
        <Tooltip title="Reîmprospătează lista">
          <IconButton 
            size="small" 
            onClick={refreshUsers} 
            aria-label="Reîmprospătează lista"
            color="primary"
            disabled={refreshing}
          >
            {refreshing ? 
              <CircularProgress size={20} color="inherit" /> : 
              <RefreshIcon />
            }
          </IconButton>
        </Tooltip>
      </Box>
      
      <Box sx={{ 
        px: 2, 
        py: 1.5, 
        borderBottom: 1, 
        borderColor: "divider",
        bgcolor: "background.paper"
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          bgcolor: alpha(theme.palette.common.black, 0.05),
          borderRadius: 2,
          px: 1,
          boxShadow: 'inset 0 0 2px rgba(0,0,0,0.1)'
        }}>
          <InputBase
            placeholder="Caută utilizatori..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            inputRef={searchInputRef}
            startAdornment={
              <SearchIcon sx={{ mr: 1, color: 'text.secondary', fontSize: '1.2rem' }} />
            }
            endAdornment={
              searchTerm && (
                <IconButton 
                  size="small" 
                  onClick={clearSearch}
                  sx={{ p: 0.5 }}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              )
            }
            sx={{ 
              ml: 1, 
              flex: 1, 
              fontSize: "0.9rem",
              '& .MuiInputBase-input': {
                py: 1
              }
            }}
            inputProps={{
              'aria-label': 'caută utilizatori',
              'placeholder': isSmall ? 'Caută...' : 'Caută utilizatori... (Ctrl+K)'
            }}
          />
          <Tooltip title="Filtrează utilizatorii">
            <IconButton 
              type="button" 
              sx={{ p: '8px' }} 
              aria-label="filtrează"
              color={showFilters || filter !== 'all' ? 'primary' : 'default'}
              onClick={() => setShowFilters(!showFilters)}
            >
              <FilterListIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Collapse in={showFilters}>
          <Box sx={{ 
            display: 'flex', 
            mt: 1.5, 
            gap: 1,
            justifyContent: 'space-between'
          }}>
            <Button
              size="small"
              variant={filter === 'all' ? 'contained' : 'outlined'}
              onClick={() => handleFilterChange('all')}
              startIcon={<PeopleIcon />}
              sx={{ 
                flex: 1,
                textTransform: 'none',
                borderRadius: 1.5
              }}
            >
              Toți
            </Button>
            <Button
              size="small"
              color="success"
              variant={filter === 'online' ? 'contained' : 'outlined'}
              onClick={() => handleFilterChange('online')}
              sx={{ 
                flex: 1,
                textTransform: 'none',
                borderRadius: 1.5
              }}
            >
              Online
            </Button>
            <Button
              size="small"
              color="secondary"
              variant={filter === 'offline' ? 'contained' : 'outlined'}
              onClick={() => handleFilterChange('offline')}
              sx={{ 
                flex: 1,
                textTransform: 'none',
                borderRadius: 1.5
              }}
            >
              Offline
            </Button>
          </Box>
        </Collapse>
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ mx: 2, my: 1 }}
          onClose={() => setError(null)}
          variant="filled"
        >
          {error}
        </Alert>
      )}
      
      {/* This is the container that needs to be scrollable */}
      <Box sx={{ 
        flexGrow: 1, 
        overflow: "auto",
        bgcolor: "background.default",
        height: isMobile ? "calc(100vh - 220px)" : "auto", // Fixed height calculation
        position: "relative",
        WebkitOverflowScrolling: "touch", // Improved inertial scrolling on iOS
        // Add these touch-action properties to ensure mobile scrolling works
        touchAction: "pan-y", 
        msOverflowStyle: "-ms-autohiding-scrollbar", // IE/Edge support
      }}>
        <Fade in={!loading} timeout={500}>
          <List sx={{ p: 0 }}>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user, index) => (
                <Zoom 
                  in={true} 
                  key={user.id}
                  style={{ 
                    transitionDelay: `${index * 50}ms`,
                    transitionDuration: '250ms'
                  }}
                >
                  <div>
                    <UserItem 
                      user={user} 
                      onSelect={() => setSelectedUser(user)} 
                    />
                  </div>
                </Zoom>
              ))
            ) : (
              <Fade in={true}>
                <Box sx={{ 
                  p: 3, 
                  textAlign: "center",
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 200
                }}>
                  <PersonIcon 
                    sx={{ 
                      fontSize: 48, 
                      color: 'text.disabled',
                      mb: 2
                    }} 
                  />
                  <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
                    {searchTerm || filter !== 'all' 
                      ? "Niciun rezultat găsit" 
                      : "Nu există alți utilizatori disponibili"
                    }
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ maxWidth: 300, mx: 'auto' }}
                  >
                    {searchTerm 
                      ? "Încearcă alte cuvinte cheie sau resetează filtrele"
                      : filter !== 'all'
                        ? `Nu există utilizatori ${filter === 'online' ? 'online' : 'offline'} în acest moment`
                        : "Asigură-te că există mai mulți utilizatori conectați și că sunt corect salvați în baza de date."
                    }
                  </Typography>
                  {(searchTerm || filter !== 'all') && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        setSearchTerm('');
                        setFilter('all');
                      }}
                      sx={{ mt: 2 }}
                    >
                      Resetează filtrele
                    </Button>
                  )}
                </Box>
              </Fade>
            )}
            {filteredUsers.length > 0 && (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  {filteredUsers.length} utilizatori afișați
                </Typography>
              </Box>
            )}
          </List>
        </Fade>
      </Box>
    </Box>
  );
};

export default UserList;