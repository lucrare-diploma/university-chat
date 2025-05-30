// src/components/GroupList.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  IconButton,
  Tooltip,
  Fab,
  useTheme,
  useMediaQuery,
  Paper,
  Divider,
  InputAdornment,
  CircularProgress,
  Snackbar,
  Alert,
  Switch,
  FormControlLabel,
  Zoom,
  Fade
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import GroupIcon from '@mui/icons-material/Group';
import LockIcon from '@mui/icons-material/Lock';
import CodeIcon from '@mui/icons-material/Code';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PeopleIcon from '@mui/icons-material/People';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SearchIcon from '@mui/icons-material/Search';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { createGroup, joinGroupByCode, getUserGroups } from '../utils/groupUtils';

const GroupList = ({ onSelectGroup, selectedChat, onGroupCountChange }) => {
  // State pentru grupuri și interfață
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  
  // State pentru crearea grupului
  const [newGroupData, setNewGroupData] = useState({
    name: '',
    description: '',
    isPrivate: false,
    maxMembers: 50
  });
  
  // State pentru alăturarea la grup
  const [joinCode, setJoinCode] = useState('');
  
  // State pentru loading și mesaje
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  const { currentUser } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Monitorizează grupurile utilizatorului în timp real
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    console.log("Configurez monitoring pentru grupurile utilizatorului:", currentUser.uid);
    
    const groupsQuery = query(
      collection(db, "groups"),
      where("members", "array-contains", currentUser.uid)
    );

    const unsubscribe = onSnapshot(groupsQuery, (snapshot) => {
      console.log("Actualizare grupuri primită:", snapshot.size, "grupuri");
      const groupsList = [];
      
      snapshot.forEach((doc) => {
        const groupData = doc.data();
        groupsList.push({
          id: doc.id,
          ...groupData,
          type: 'group' // Marcăm că este un grup pentru componenta Chat
        });
      });
      
      // Sortează grupurile după ultima activitate
      groupsList.sort((a, b) => {
        const aTime = a.lastActivity?.toDate() || new Date(0);
        const bTime = b.lastActivity?.toDate() || new Date(0);
        return bTime - aTime;
      });
      
      setGroups(groupsList);
      setLoading(false);
      
      // Informează părinte-ul despre numărul de grupuri (pentru badge-ul din tab)
      if (onGroupCountChange) {
        onGroupCountChange(groupsList.length);
      }
    }, (error) => {
      console.error("Eroare la monitorizarea grupurilor:", error);
      setSnackbar({
        open: true,
        message: "Eroare la încărcarea grupurilor: " + error.message,
        severity: 'error'
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, onGroupCountChange]);

  // Funcție pentru crearea unui grup nou
  const handleCreateGroup = async () => {
    if (!newGroupData.name.trim()) {
      setSnackbar({
        open: true,
        message: "Numele grupului este obligatoriu",
        severity: 'warning'
      });
      return;
    }
    
    setCreating(true);
    try {
      console.log("Creez grup nou cu datele:", newGroupData);
      const group = await createGroup(newGroupData, currentUser.uid);
      
      // Resetăm formularul
      setShowCreateDialog(false);
      setNewGroupData({ 
        name: '', 
        description: '', 
        isPrivate: false,
        maxMembers: 50 
      });
      
      // Afișăm mesaj de succes cu codul grupului
      setSnackbar({
        open: true,
        message: `Grup creat cu succes! Codul este: ${group.code}`,
        severity: 'success'
      });
      
      // Selectează automat grupul nou creat
      onSelectGroup({
        ...group,
        type: 'group'
      });
      
      console.log("Grup creat cu succes:", group);
      
    } catch (error) {
      console.error("Eroare la crearea grupului:", error);
      setSnackbar({
        open: true,
        message: "Eroare la crearea grupului: " + error.message,
        severity: 'error'
      });
    } finally {
      setCreating(false);
    }
  };

  // Funcție pentru alăturarea la un grup cu cod
  const handleJoinGroup = async () => {
    if (!joinCode.trim()) {
      setSnackbar({
        open: true,
        message: "Codul de grup este obligatoriu",
        severity: 'warning'
      });
      return;
    }
    
    setJoining(true);
    try {
      console.log("Încerc să mă alătur la grupul cu codul:", joinCode);
      const group = await joinGroupByCode(joinCode, currentUser.uid);
      
      // Resetăm formularul
      setShowJoinDialog(false);
      setJoinCode('');
      
      // Afișăm mesaj de succes
      setSnackbar({
        open: true,
        message: `Te-ai alăturat cu succes la grupul "${group.name}"!`,
        severity: 'success'
      });
      
      // Selectează automat grupul la care s-a alăturat
      onSelectGroup({
        ...group,
        type: 'group'
      });
      
      console.log("M-am alăturat cu succes la grup:", group);
      
    } catch (error) {
      console.error("Eroare la alăturarea în grup:", error);
      setSnackbar({
        open: true,
        message: error.message,
        severity: 'error'
      });
    } finally {
      setJoining(false);
    }
  };

  // Funcție pentru copierea codului unui grup
  const handleCopyCode = (code, groupName) => {
    navigator.clipboard.writeText(code).then(() => {
      setSnackbar({
        open: true,
        message: `Codul pentru "${groupName}" a fost copiat!`,
        severity: 'success'
      });
    }).catch(err => {
      console.error("Eroare la copierea codului:", err);
      setSnackbar({
        open: true,
        message: "Nu s-a putut copia codul",
        severity: 'error'
      });
    });
  };

  // Funcție pentru formatarea timpului
  const formatLastActivity = (timestamp) => {
    if (!timestamp) return "Necunoscut";
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) return "Acum";
    if (diffHours < 24) return `${diffHours}h în urmă`;
    if (diffDays < 7) return `${diffDays} zile în urmă`;
    return date.toLocaleDateString('ro-RO');
  };

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
          Se încarcă grupurile...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header cu butoane de acțiune */}
      <Box sx={{
        p: 2,
        borderBottom: 1,
        borderColor: 'divider',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        bgcolor: 'background.paper'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <GroupIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600 }}>
            Grupurile mele
          </Typography>
          {groups.length > 0 && (
            <Chip 
              label={groups.length} 
              size="small" 
              color="primary" 
              variant="outlined"
              sx={{ ml: 1 }}
            />
          )}
        </Box>
        <Box>
          <Tooltip title="Intră în grup cu cod">
            <IconButton 
              onClick={() => setShowJoinDialog(true)} 
              size="small"
              color="primary"
            >
              <PersonAddIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Creează grup nou">
            <IconButton 
              onClick={() => setShowCreateDialog(true)} 
              size="small"
              color="primary"
            >
              <AddIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Lista de grupuri */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {groups.length > 0 ? (
          <List sx={{ p: 0 }}>
            {groups.map((group, index) => (
              <Zoom 
                in={true} 
                key={group.id}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div>
                  <ListItem
                    button
                    onClick={() => onSelectGroup(group)}
                    selected={selectedChat?.id === group.id && selectedChat?.type === 'group'}
                    sx={{
                      borderRadius: 1,
                      mx: 1,
                      mb: 0.5,
                      transition: 'all 0.2s',
                      '&.Mui-selected': {
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        '&:hover': {
                          bgcolor: 'primary.dark'
                        }
                      },
                      '&:hover': {
                        bgcolor: 'action.hover',
                        transform: 'translateY(-1px)'
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar 
                        sx={{ 
                          bgcolor: group.isPrivate ? 'secondary.main' : 'primary.main',
                          color: 'white'
                        }}
                      >
                        {group.avatar || <GroupIcon />}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                              {group.name}
                            </Typography>
                            <LockIcon sx={{ ml: 1, fontSize: '0.8rem', opacity: 0.7 }} />
                            {group.isPrivate && (
                              <Chip 
                                label="Privat" 
                                size="small" 
                                color="secondary" 
                                variant="outlined"
                                sx={{ ml: 0.5, height: 18, fontSize: '0.65rem' }}
                              />
                            )}
                          </Box>
                          <Tooltip title={`Copiază codul: ${group.code}`}>
                            <IconButton 
                              size="small" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyCode(group.code, group.name);
                              }}
                              sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
                            >
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <PeopleIcon sx={{ fontSize: '0.8rem', mr: 0.5, opacity: 0.6 }} />
                            <Typography variant="caption" color="textSecondary">
                              {group.members?.length || 0} membri
                            </Typography>
                            <Typography variant="caption" color="textSecondary" sx={{ mx: 1 }}>
                              •
                            </Typography>
                            <CodeIcon sx={{ fontSize: '0.8rem', mr: 0.5, opacity: 0.6 }} />
                            <Typography variant="caption" color="textSecondary">
                              {group.code}
                            </Typography>
                          </Box>
                          {group.description && (
                            <Typography variant="body2" noWrap sx={{ mb: 0.5, opacity: 0.8 }}>
                              {group.description}
                            </Typography>
                          )}
                          <Typography variant="caption" color="textSecondary">
                            Ultima activitate: {formatLastActivity(group.lastActivity)}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  <Divider variant="inset" component="li" sx={{ opacity: 0.6 }} />
                </div>
              </Zoom>
            ))}
          </List>
        ) : (
          // Ecran gol când nu există grupuri
          <Fade in={true}>
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              p: 3,
              textAlign: 'center'
            }}>
              <GroupIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 500 }}>
                Nu faci parte din niciun grup
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 280 }}>
                Creează un grup nou pentru a colabora cu echipa ta sau alătură-te la un grup existent cu un cod
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexDirection: isMobile ? 'column' : 'row' }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setShowCreateDialog(true)}
                  sx={{ textTransform: 'none' }}
                >
                  Creează grup
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<PersonAddIcon />}
                  onClick={() => setShowJoinDialog(true)}
                  sx={{ textTransform: 'none' }}
                >
                  Intră în grup
                </Button>
              </Box>
            </Box>
          </Fade>
        )}
      </Box>

      {/* Dialog pentru crearea grupului */}
      <Dialog 
        open={showCreateDialog} 
        onClose={() => setShowCreateDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <GroupIcon sx={{ mr: 1, color: 'primary.main' }} />
            Creează un grup nou
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            autoFocus
            margin="dense"
            label="Numele grupului *"
            fullWidth
            variant="outlined"
            value={newGroupData.name}
            onChange={(e) => setNewGroupData(prev => ({ ...prev, name: e.target.value }))}
            sx={{ mb: 2 }}
            placeholder="ex: Proiect BD - Grupa 123"
            inputProps={{ maxLength: 50 }}
            helperText={`${newGroupData.name.length}/50 caractere`}
          />
          <TextField
            margin="dense"
            label="Descrierea grupului"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={newGroupData.description}
            onChange={(e) => setNewGroupData(prev => ({ ...prev, description: e.target.value }))}
            sx={{ mb: 2 }}
            placeholder="Scurtă descriere a scopului grupului..."
            inputProps={{ maxLength: 200 }}
            helperText={`${newGroupData.description.length}/200 caractere`}
          />
          <TextField
            margin="dense"
            label="Număr maxim de membri"
            type="number"
            fullWidth
            variant="outlined"
            value={newGroupData.maxMembers}
            onChange={(e) => setNewGroupData(prev => ({ ...prev, maxMembers: parseInt(e.target.value) || 50 }))}
            sx={{ mb: 2 }}
            InputProps={{
              inputProps: { min: 2, max: 100 }
            }}
            helperText="Între 2 și 100 de membri"
          />
          <FormControlLabel
            control={
              <Switch
                checked={newGroupData.isPrivate}
                onChange={(e) => setNewGroupData(prev => ({ ...prev, isPrivate: e.target.checked }))}
                color="primary"
              />
            }
            label="Grup privat"
            sx={{ mt: 1 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            Grupurile private sunt vizibile doar pentru membri
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button onClick={() => setShowCreateDialog(false)} disabled={creating}>
            Anulează
          </Button>
          <Button 
            onClick={handleCreateGroup} 
            variant="contained" 
            disabled={!newGroupData.name.trim() || creating}
            startIcon={creating ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
          >
            {creating ? 'Se creează...' : 'Creează grupul'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog pentru alăturarea la grup */}
      <Dialog 
        open={showJoinDialog} 
        onClose={() => setShowJoinDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PersonAddIcon sx={{ mr: 1, color: 'primary.main' }} />
            Intră într-un grup
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            autoFocus
            margin="dense"
            label="Codul grupului"
            fullWidth
            variant="outlined"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="ex: A3X7K9"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CodeIcon color="action" />
                </InputAdornment>
              )
            }}
            inputProps={{ 
              maxLength: 6,
              style: { textTransform: 'uppercase' }
            }}
            helperText="Introduceți codul de 6 caractere primit de la administratorul grupului"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button onClick={() => setShowJoinDialog(false)} disabled={joining}>
            Anulează
          </Button>
          <Button 
            onClick={handleJoinGroup} 
            variant="contained" 
            disabled={!joinCode.trim() || joinCode.length !== 6 || joining}
            startIcon={joining ? <CircularProgress size={16} color="inherit" /> : <PersonAddIcon />}
          >
            {joining ? 'Se alătură...' : 'Intră în grup'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar pentru mesaje */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default GroupList;