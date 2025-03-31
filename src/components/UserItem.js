import React from "react";
import {
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Divider
} from "@mui/material";

const UserItem = ({ user, onSelect }) => {
  return (
    <>
      <ListItem button onClick={onSelect}>
        <ListItemAvatar>
          <Avatar src={user.photoURL} alt={user.displayName}>
            {user.displayName?.charAt(0) || "U"}
          </Avatar>
        </ListItemAvatar>
        <ListItemText primary={user.displayName || "Utilizator"} />
      </ListItem>
      <Divider />
    </>
  );
};

export default UserItem;