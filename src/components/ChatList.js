import React, { useState } from "react";
import { Box, Grid, Drawer, useMediaQuery, useTheme, Paper } from "@mui/material";
import UserList from "./UserList";
import Chat from "./Chat";

const ChatList = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    if (isMobile) {
      setMobileOpen(true);
    }
  };

  const handleBack = () => {
    if (isMobile) {
      setMobileOpen(false);
    } else {
      setSelectedUser(null);
    }
  };

  if (isMobile) {
    return (
      <Box sx={{ height: "calc(100vh - 64px)", bgcolor: "background.default" }}>
        {!mobileOpen && (
          <Paper 
            elevation={2} 
            sx={{ 
              height: "100%", 
              borderRadius: 0 
            }}
          >
            <UserList setSelectedUser={handleSelectUser} />
          </Paper>
        )}
        <Drawer
          anchor="right"
          open={mobileOpen}
          onClose={handleBack}
          sx={{
            width: "100%",
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: "100%",
              boxSizing: "border-box",
            },
          }}
        >
          {selectedUser && (
            <Chat selectedUser={selectedUser} onBack={handleBack} />
          )}
        </Drawer>
      </Box>
    );
  }

  return (
    <Grid container sx={{ height: "calc(100vh - 64px)" }} spacing={0}>
      <Grid item xs={12} sm={4} md={3} lg={3} sx={{ height: "100%" }}>
        <Paper 
          elevation={2} 
          sx={{ 
            height: "100%", 
            borderRadius: 0,
            borderRight: 1,
            borderColor: 'divider'
          }}
        >
          <UserList setSelectedUser={setSelectedUser} />
        </Paper>
      </Grid>
      <Grid item xs={12} sm={8} md={9} lg={9} sx={{ height: "100%" }}>
        {selectedUser ? (
          <Chat selectedUser={selectedUser} onBack={handleBack} />
        ) : (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
              bgcolor: "background.default"
            }}
          >
            Selectează un utilizator pentru a începe o conversație
          </Box>
        )}
      </Grid>
    </Grid>
  );
};

export default ChatList;