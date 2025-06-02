import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Avatar,
  Paper,
  Button,
  IconButton,
  TextField,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  useTheme,
  useMediaQuery,
  Tooltip,
  Fade,
  Chip,
  Switch,
  FormControlLabel,
  Grid,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import SecurityIcon from "@mui/icons-material/Security";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import TextFormatIcon from "@mui/icons-material/TextFormat";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

import { useAuth } from "../context/AuthContext";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { isAIAvailable } from "../utils/aiSuggestions";

import { useParams, useNavigate } from 'react-router-dom';

const Profile = () => {
  
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [editableDetails, setEditableDetails] = useState({
    displayName: "",
    statusMessage: "",
    notificationsEnabled: true,
    suggestionEnabled: true,
    aiEnabled: true, // Adăugăm noua setare pentru sugestiile AI
    privacy: {
      showLastSeen: true,
      showOnlineStatus: true,
    },
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    message: "",
    action: null,
  });

  // Verifică disponibilitatea API-ului AI
  const aiAvailable = isAIAvailable();

  // Fetch user details from Firestore
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!currentUser) return;

      setLoading(true);
      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserDetails(userData);

          // Initialize editable details
          setEditableDetails({
            displayName: userData.displayName || currentUser.displayName || "",
            statusMessage: userData.statusMessage || "",
            notificationsEnabled: userData.notificationsEnabled !== false, // Default to true
            suggestionEnabled: userData.suggestionEnabled !== false, // Default to true
            aiEnabled: userData.aiEnabled !== false, // Default to true
            privacy: {
              showLastSeen: userData.privacy?.showLastSeen !== false, // Default to true
              showOnlineStatus: userData.privacy?.showOnlineStatus !== false, // Default to true
            },
          });
        } else {
          // If user document doesn't exist, initialize with defaults
          setUserDetails({
            displayName: currentUser.displayName,
            email: currentUser.email,
            photoURL: currentUser.photoURL,
            createdAt: new Date(),
            online: true,
          });

          setEditableDetails({
            displayName: currentUser.displayName || "",
            statusMessage: "",
            notificationsEnabled: true,
            suggestionEnabled: true,
            aiEnabled: true,
            privacy: {
              showLastSeen: true,
              showOnlineStatus: true,
            },
          });
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
        setSnackbar({
          open: true,
          message: "Nu s-au putut încărca detaliile profilului",
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [currentUser]);

  const handleSave = async () => {
    if (!currentUser) return;

    setSaving(true);
    try {
      const userDocRef = doc(db, "users", currentUser.uid);

      await updateDoc(userDocRef, {
        displayName: editableDetails.displayName,
        statusMessage: editableDetails.statusMessage,
        notificationsEnabled: editableDetails.notificationsEnabled,
        suggestionEnabled: editableDetails.suggestionEnabled,
        aiEnabled: editableDetails.aiEnabled, // Salvăm setarea pentru AI
        privacy: {
          showLastSeen: editableDetails.privacy.showLastSeen,
          showOnlineStatus: editableDetails.privacy.showOnlineStatus,
        },
        updatedAt: new Date(),
      });

      // Update local state
      setUserDetails((prev) => ({
        ...prev,
        displayName: editableDetails.displayName,
        statusMessage: editableDetails.statusMessage,
        notificationsEnabled: editableDetails.notificationsEnabled,
        suggestionEnabled: editableDetails.suggestionEnabled,
        aiEnabled: editableDetails.aiEnabled,
        privacy: {
          showLastSeen: editableDetails.privacy.showLastSeen,
          showOnlineStatus: editableDetails.privacy.showOnlineStatus,
        },
      }));

      setSnackbar({
        open: true,
        message: "Profilul a fost actualizat cu succes",
        severity: "success",
      });

      setEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      setSnackbar({
        open: true,
        message: "Eroare la actualizarea profilului",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (editing) {
      setConfirmDialog({
        open: true,
        title: "Renunți la modificări?",
        message: "Toate modificările efectuate vor fi pierdute.",
        action: () => {
          // Reset editable details to original values
          if (userDetails) {
            setEditableDetails({
              displayName:
                userDetails.displayName || currentUser.displayName || "",
              statusMessage: userDetails.statusMessage || "",
              notificationsEnabled: userDetails.notificationsEnabled !== false,
              suggestionEnabled: userDetails.suggestionEnabled !== false,
              aiEnabled: userDetails.aiEnabled !== false,
              privacy: {
                showLastSeen: userDetails.privacy?.showLastSeen !== false,
                showOnlineStatus:
                  userDetails.privacy?.showOnlineStatus !== false,
              },
            });
          }
          setEditing(false);
        },
      });
    } else {
      // Just go back if not editing
      navigate('/university-chat', { replace: true });
    }
  };

  const handleBackWithConfirm = () => {
    if (editing) {
      setConfirmDialog({
        open: true,
        title: "Renunți la modificări?",
        message: "Toate modificările efectuate vor fi pierdute."
      });
    } else {
      navigate('/university-chat', { replace: true });
    }
  };

  const formatDate = (date) => {
    if (!date) return "Necunoscut";

    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString("ro-RO", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          p: 3,
        }}
      >
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2, color: "text.secondary" }}>
          Se încarcă profilul...
        </Typography>
      </Box>
    );
  }

  return (
    <Paper
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
        overflow: "auto",
      }}
      elevation={0}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          bgcolor: "primary.dark",
          color: "white",
          display: "flex",
          alignItems: "center",
        }}
      >
        <IconButton
          color="inherit"
          onClick={handleBackWithConfirm}
          sx={{ mr: 2 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Profilul meu
        </Typography>
        {editing ? (
          <>
            <Tooltip title="Salvează modificările">
              <IconButton
                color="inherit"
                onClick={handleSave}
                disabled={saving}
                sx={{ mr: 1 }}
              >
                {saving ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  <SaveIcon />
                )}
              </IconButton>
            </Tooltip>
            <Tooltip title="Anulează modificările">
              <IconButton
                color="inherit"
                onClick={handleCancel}
                disabled={saving}
              >
                <CancelIcon />
              </IconButton>
            </Tooltip>
          </>
        ) : (
          <Tooltip title="Editează profilul">
            <IconButton color="inherit" onClick={() => setEditing(true)}>
              <EditIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Profile Avatar and Main Info */}
      <Box
        sx={{
          bgcolor: theme.palette.primary.main,
          color: "white",
          py: 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
        }}
      >
        <Avatar
          src={currentUser?.photoURL}
          alt={editableDetails.displayName}
          sx={{
            width: isMobile ? 100 : 120,
            height: isMobile ? 100 : 120,
            border: 4,
            borderColor: "white",
            boxShadow: 3,
          }}
        >
          {editableDetails.displayName?.charAt(0) || "U"}
        </Avatar>

        <Box sx={{ mt: 2, textAlign: "center" }}>
          {editing ? (
            <TextField
              value={editableDetails.displayName}
              onChange={(e) =>
                setEditableDetails((prev) => ({
                  ...prev,
                  displayName: e.target.value,
                }))
              }
              variant="filled"
              label="Nume de afișare"
              InputProps={{
                sx: {
                  color: "white",
                  bgcolor: "rgba(255,255,255,0.1)",
                  "&:hover": {
                    bgcolor: "rgba(255,255,255,0.15)",
                  },
                  "& .MuiInputBase-input": {
                    textAlign: "center",
                  },
                },
              }}
              InputLabelProps={{
                sx: { color: "rgba(255,255,255,0.7)" },
              }}
              sx={{ mb: 1 }}
            />
          ) : (
            <Typography variant="h5" sx={{ fontWeight: 500 }}>
              {editableDetails.displayName}
            </Typography>
          )}

          <Typography variant="body1" sx={{ opacity: 0.9, mt: 0.5 }}>
            {currentUser?.email}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          mt: -2,
          bgcolor: "background.paper",
          borderRadius: "16px 16px 0 0",
          p: 3,
          flexGrow: 1,
        }}
      >
        {/* Status Message Section */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle1"
            color="primary"
            gutterBottom
            sx={{ display: "flex", alignItems: "center" }}
          >
            <AccountCircleIcon fontSize="small" sx={{ mr: 1 }} />
            Status
          </Typography>

          {editing ? (
            <TextField
              fullWidth
              variant="outlined"
              label="Mesaj de status"
              placeholder="Ce faci în prezent?"
              value={editableDetails.statusMessage}
              onChange={(e) =>
                setEditableDetails((prev) => ({
                  ...prev,
                  statusMessage: e.target.value,
                }))
              }
              multiline
              maxRows={2}
              sx={{ mt: 1 }}
            />
          ) : (
            <Paper
              elevation={0}
              sx={{
                p: 2,
                bgcolor: "background.default",
                borderRadius: 2,
                minHeight: 60,
                display: "flex",
                alignItems: "center",
              }}
            >
              <Typography variant="body1" sx={{ color: "text.secondary" }}>
                {editableDetails.statusMessage || "Niciun status setat"}
              </Typography>
            </Paper>
          )}
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Privacy & Security Section */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle1"
            color="primary"
            gutterBottom
            sx={{ display: "flex", alignItems: "center" }}
          >
            <SecurityIcon fontSize="small" sx={{ mr: 1 }} />
            Confidențialitate și notificări
          </Typography>

          <Paper
            elevation={0}
            sx={{
              p: 2,
              bgcolor: "background.default",
              borderRadius: 2,
            }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={editableDetails.notificationsEnabled}
                      onChange={(e) =>
                        setEditableDetails((prev) => ({
                          ...prev,
                          notificationsEnabled: e.target.checked,
                        }))
                      }
                      disabled={!editing}
                      color="primary"
                    />
                  }
                  label="Primește notificări"
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={editableDetails.privacy.showOnlineStatus}
                      onChange={(e) =>
                        setEditableDetails((prev) => ({
                          ...prev,
                          privacy: {
                            ...prev.privacy,
                            showOnlineStatus: e.target.checked,
                          },
                        }))
                      }
                      disabled={!editing}
                      color="primary"
                    />
                  }
                  label="Arată statusul online"
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={editableDetails.privacy.showLastSeen}
                      onChange={(e) =>
                        setEditableDetails((prev) => ({
                          ...prev,
                          privacy: {
                            ...prev.privacy,
                            showLastSeen: e.target.checked,
                          },
                        }))
                      }
                      disabled={!editing}
                      color="primary"
                    />
                  }
                  label="Arată ultima activitate"
                />
              </Grid>
            </Grid>
          </Paper>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Text Assistance Section */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle1"
            color="primary"
            gutterBottom
            sx={{ display: "flex", alignItems: "center" }}
          >
            <TextFormatIcon fontSize="small" sx={{ mr: 1 }} />
            Asistență la scriere
          </Typography>

          <Paper
            elevation={0}
            sx={{
              p: 2,
              bgcolor: "background.default",
              borderRadius: 2,
            }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={editableDetails.suggestionEnabled}
                      onChange={(e) =>
                        setEditableDetails((prev) => ({
                          ...prev,
                          suggestionEnabled: e.target.checked,
                        }))
                      }
                      disabled={!editing}
                      color="primary"
                    />
                  }
                  label="Arată sugestii de cuvinte în timpul scrierii"
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ pl: 6, mt: 0.5 }}
                >
                  Activează sau dezactivează sugestiile de text ce apar în
                  timpul scrierii mesajelor
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* AI Suggestions Section - NEW */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle1"
            color="primary"
            gutterBottom
            sx={{ display: "flex", alignItems: "center" }}
          >
            <SmartToyIcon fontSize="small" sx={{ mr: 1 }} />
            Sugestii inteligente cu AI
          </Typography>

          <Paper
            elevation={0}
            sx={{
              p: 2,
              bgcolor: "background.default",
              borderRadius: 2,
            }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={editableDetails.aiEnabled}
                      onChange={(e) =>
                        setEditableDetails((prev) => ({
                          ...prev,
                          aiEnabled: e.target.checked,
                        }))
                      }
                      disabled={!editing || !aiAvailable}
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      Activează sugestiile AI
                      {!aiAvailable && (
                        <Chip
                          label="Indisponibil"
                          size="small"
                          color="default"
                          sx={{ ml: 1, height: 20, fontSize: "0.7rem" }}
                        />
                      )}
                    </Box>
                  }
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ pl: 6, mt: 0.5 }}
                >
                  Primește sugestii de răspunsuri personalizate generate de
                  inteligență artificială
                  {!aiAvailable && (
                    <Typography
                      variant="body2"
                      color="warning.main"
                      sx={{ mt: 0.5 }}
                    >
                      OpenAI API nu este configurat. Contactează administratorul
                      pentru activare.
                    </Typography>
                  )}
                </Typography>
              </Grid>
            </Grid>

            {/* Preview of AI suggestions */}
            {aiAvailable && (
              <Box
                sx={{
                  mt: 2,
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.primary.light, 0.07),
                  border: `1px dashed ${alpha(
                    theme.palette.primary.main,
                    0.2
                  )}`,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    mb: 1,
                  }}
                >
                  <AutoAwesomeIcon
                    fontSize="small"
                    color="primary"
                    sx={{ mr: 1, opacity: 0.8 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Exemplu de sugestii
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                    opacity: editableDetails.aiEnabled ? 1 : 0.5,
                  }}
                >
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AutoAwesomeIcon fontSize="small" />}
                    sx={{
                      justifyContent: "flex-start",
                      textTransform: "none",
                      borderRadius: 2,
                      py: 0.5,
                      px: 1.5,
                      fontWeight: 400,
                      textAlign: "left",
                      // eslint-disable-next-line no-undef
                      borderColor: alpha(theme.palette.primary.main, 0.3),
                    }}
                  >
                    Mulțumesc pentru informații, o să verific și revin cu un
                    răspuns.
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AutoAwesomeIcon fontSize="small" />}
                    sx={{
                      justifyContent: "flex-start",
                      textTransform: "none",
                      borderRadius: 2,
                      py: 0.5,
                      px: 1.5,
                      fontWeight: 400,
                      textAlign: "left",
                      // eslint-disable-next-line no-undef
                      borderColor: alpha(theme.palette.primary.main, 0.3),
                    }}
                  >
                    Sunt disponibil mâine după ora 14:00, ți-ar conveni să ne
                    întâlnim atunci?
                  </Button>
                </Box>
              </Box>
            )}
          </Paper>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Account Information */}
        <Box>
          <Typography
            variant="subtitle1"
            color="primary"
            gutterBottom
            sx={{ display: "flex", alignItems: "center" }}
          >
            <AccountCircleIcon fontSize="small" sx={{ mr: 1 }} />
            Informații cont
          </Typography>

          <Paper
            elevation={0}
            sx={{
              p: 2,
              bgcolor: "background.default",
              borderRadius: 2,
            }}
          >
            <Grid container spacing={2}>
              <Grid item xs={6} sm={4}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Creat la
                </Typography>
                <Typography variant="body1">
                  {userDetails?.createdAt
                    ? formatDate(userDetails.createdAt)
                    : "Necunoscut"}
                </Typography>
              </Grid>

              <Grid item xs={6} sm={4}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Ultima autentificare
                </Typography>
                <Typography variant="body1">
                  {userDetails?.lastActive
                    ? formatDate(userDetails.lastActive)
                    : "Necunoscut"}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Status cont
                </Typography>
                <Chip
                  label="Activ"
                  color="success"
                  size="small"
                  sx={{ mt: 0.5 }}
                />
              </Grid>
            </Grid>
          </Paper>
        </Box>

        {/* Add button to save changes when in edit mode */}
        {editing && (
          <Box
            sx={{
              mt: 4,
              display: "flex",
              justifyContent: "center",
              gap: 2,
            }}
          >
            <Button
              variant="outlined"
              color="primary"
              onClick={handleCancel}
              startIcon={<CancelIcon />}
            >
              Anulează
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
              disabled={saving}
            >
              Salvează modificările
            </Button>
          </Box>
        )}
      </Box>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
      >
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{confirmDialog.message}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setConfirmDialog((prev) => ({ ...prev, open: false }))
            }
          >
            Nu
          </Button>
          <Button
            onClick={() => {
              confirmDialog.action && confirmDialog.action();
              setConfirmDialog((prev) => ({ ...prev, open: false }));
            }}
            color="primary"
            autoFocus
          >
            Da
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default Profile;
