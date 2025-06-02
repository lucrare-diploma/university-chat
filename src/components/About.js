import React from "react";
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Link,
  useTheme,
  useMediaQuery,
  Chip,
  Avatar,
  Grid,
  Card,
  CardContent,
  alpha,
  Tooltip,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LockIcon from "@mui/icons-material/Lock";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SecurityIcon from "@mui/icons-material/Security";
import InfoIcon from "@mui/icons-material/Info";
import GitHubIcon from "@mui/icons-material/GitHub";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MessageIcon from "@mui/icons-material/Message";
import DevicesIcon from "@mui/icons-material/Devices";
import GroupIcon from "@mui/icons-material/Group";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import PrivacyTipIcon from "@mui/icons-material/PrivacyTip";

import logo from "../logo.svg";

import { useParams, useNavigate } from 'react-router-dom';

const About = ({ onBack }) => {
  
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleBack = () => {
    navigate('/university-chat', { replace: true });
  };
  
  // Features list
  const features = [
    {
      title: "Criptare end-to-end",
      description: "Toate mesajele sunt criptate end-to-end, asigurând că doar expeditorul și destinatarul pot citi conținutul.",
      icon: <LockIcon color="primary" />
    },
    {
      title: "Conversații în timp real",
      description: "Mesajele sunt livrate instantaneu, permițând conversații fluide între utilizatori.",
      icon: <MessageIcon color="primary" />
    },
    {
      title: "Notificări",
      description: "Primește notificări atunci când primești mesaje noi, chiar și când aplicația nu este deschisă.",
      icon: <NotificationsActiveIcon color="primary" />
    },
    {
      title: "Compatibilitate multiplă",
      description: "Aplicația funcționează perfect pe desktop, tabletă și dispozitive mobile.",
      icon: <DevicesIcon color="primary" />
    },
    {
      title: "Management utilizatori",
      description: "Vezi care utilizatori sunt online și intră ușor în contact cu ei.",
      icon: <GroupIcon color="primary" />
    },
    {
      title: "Confidențialitate avansată",
      description: "Controlezi ce informații sunt vizibile pentru alți utilizatori și cum interacționezi cu platforma.",
      icon: <PrivacyTipIcon color="primary" />
    }
  ];

  // FAQ items
  const faqItems = [
    {
      question: "Ce înseamnă criptare end-to-end?",
      answer: "Criptarea end-to-end asigură că mesajele tale sunt criptate pe dispozitivul tău și pot fi decriptate doar de destinatar. Nici măcar administratorii aplicației nu pot citi mesajele tale. Folosim algoritmul AES-256 pentru criptare, care este unul dintre cele mai sigure standarde disponibile."
    },
    {
      question: "Cine poate vedea când sunt online?",
      answer: "Poți controla vizibilitatea statusului tău online din secțiunea Profil. Dacă dezactivezi această opțiune, alți utilizatori nu vor putea vedea când ești activ."
    },
    {
      question: "Pot șterge mesajele trimise?",
      answer: "Da, poți șterge orice mesaj trimis, dar ține cont că destinatarul este posibil să-l fi văzut deja."
    },
    {
      question: "Cum funcționează notificările?",
      answer: "Când cineva îți trimite un mesaj, vei primi o notificare dacă ai permis notificările în setări. Poți dezactiva notificările în orice moment din pagina de Profil."
    },
    {
      question: "Sunt mesajele mele stocate pe server?",
      answer: "Mesajele sunt stocate în format criptat pe serverele noastre pentru a permite sincronizarea între dispozitive, dar conținutul lor nu poate fi citit de nimeni în afară de tine și de destinatar datorită criptării end-to-end."
    }
  ];

  // Technical details
  const techStack = [
    { name: "React", version: "19.1.0" },
    { name: "Firebase", version: "11.6.0" },
    { name: "Material-UI", version: "7.0.1" },
    { name: "CryptoJS", version: "4.2.0" }
  ];

  return (
    <Paper
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "auto",
        bgcolor: "background.default"
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
          alignItems: "center"
        }}
      >
        <IconButton
          color="inherit"
          onClick={handleBack}
          sx={{ mr: 2 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Despre aplicație
        </Typography>
      </Box>

      {/* App info section */}
      <Box
        sx={{
          bgcolor: theme.palette.primary.main,
          color: "white",
          py: 4,
          px: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center"
        }}
      >
        <Avatar
          src={logo}
          sx={{ 
            width: 80, 
            height: 80, 
            mb: 2,
            bgcolor: "white",
            p: 1
          }}
        >
          <MessageIcon />
        </Avatar>
        
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          USV Chat
        </Typography>
        
        <Typography variant="subtitle1" sx={{ maxWidth: 600, mx: "auto", opacity: 0.9 }}>
          Platforma de mesagerie sigură și criptată pentru comunitatea Universității "Ștefan cel Mare" din Suceava
        </Typography>
        
        <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "center" }}>
          <Chip 
            label="Versiunea 1.0.0" 
            variant="outlined" 
            sx={{ 
              borderColor: "rgba(255,255,255,0.3)", 
              color: "white",
              "& .MuiChip-label": { px: 2 }
            }} 
          />
          <Chip 
            icon={<LockIcon sx={{ color: "white !important" }} />} 
            label="End-to-End Encryption" 
            variant="outlined" 
            sx={{ 
              borderColor: "rgba(255,255,255,0.3)", 
              color: "white",
              "& .MuiChip-label": { px: 2 }
            }} 
          />
          <Chip 
            label="Firebase" 
            variant="outlined" 
            sx={{ 
              borderColor: "rgba(255,255,255,0.3)", 
              color: "white",
              "& .MuiChip-label": { px: 2 }
            }} 
          />
        </Box>
      </Box>

      {/* Content container */}
      <Box 
        sx={{ 
          mt: -2, 
          pt: 2,
          px: isMobile ? 2 : 4,
          pb: 4,
          bgcolor: "background.paper", 
          borderRadius: "16px 16px 0 0",
          flexGrow: 1,
          boxShadow: "0px -4px 10px rgba(0,0,0,0.05)"
        }}
      >
        {/* Introduction Section */}
        <Box sx={{ mb: 4, mt: 2 }}>
          <Typography variant="body1" paragraph>
            USV Chat este o aplicație de mesagerie modernă, dezvoltată special pentru comunitatea Universității "Ștefan cel Mare" din Suceava, cu accent pe securitate, confidențialitate și experiență de utilizare plăcută.
          </Typography>
          <Typography variant="body1">
            Aplicația este bazată pe tehnologii de ultimă generație și implementează cele mai bune practici în materie de securitate, oferind utilizatorilor un mediu sigur pentru comunicare.
          </Typography>
        </Box>

        {/* Features Section */}
        <Typography variant="h5" sx={{ mb: 2, color: "primary.main", display: "flex", alignItems: "center" }}>
          <CheckCircleIcon sx={{ mr: 1 }} />
          Funcționalități
        </Typography>
        
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card 
                elevation={0} 
                sx={{ 
                  height: "100%",
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  transition: "all 0.2s",
                  "&:hover": {
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    transform: "translateY(-2px)"
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ display: "flex", mb: 1 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" component="h3" sx={{ mb: 1, fontSize: "1.1rem" }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Security Section */}
        <Typography variant="h5" sx={{ mb: 2, color: "primary.main", display: "flex", alignItems: "center" }}>
          <SecurityIcon sx={{ mr: 1 }} />
          Securitate și confidențialitate
        </Typography>
        
        <Paper
          elevation={0}
          sx={{ 
            p: 3, 
            mb: 4, 
            bgcolor: alpha(theme.palette.success.light, 0.1),
            border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
            borderRadius: 2
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 2, color: "success.dark" }}>
            Cum protejăm conversațiile tale
          </Typography>
          
          <List dense disablePadding>
            <ListItem>
              <ListItemIcon>
                <LockIcon color="success" />
              </ListItemIcon>
              <ListItemText 
                primary="Criptare end-to-end" 
                secondary="Toate mesajele sunt criptate folosind algoritmul AES-256 și pot fi decriptate doar de participanții la conversație." 
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon color="success" />
              </ListItemIcon>
              <ListItemText 
                primary="Chei unice pentru fiecare conversație" 
                secondary="Fiecare conversație folosește o cheie unică derivată din identificatorii utilizatorilor, asigurând că mesajele rămân private." 
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon color="success" />
              </ListItemIcon>
              <ListItemText 
                primary="Mesajele sunt stocate criptat" 
                secondary="Chiar și la nivel de server, mesajele sunt stocate în format criptat, astfel că nimeni nu le poate citi fără cheile corespunzătoare." 
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon color="success" />
              </ListItemIcon>
              <ListItemText 
                primary="Control asupra datelor personale" 
                secondary="Poți decide cine îți poate vedea statusul online, ultima activitate și alte informații personale." 
              />
            </ListItem>
          </List>
        </Paper>

        {/* FAQ Section */}
        <Typography variant="h5" sx={{ mb: 2, color: "primary.main", display: "flex", alignItems: "center" }}>
          <InfoIcon sx={{ mr: 1 }} />
          Întrebări frecvente
        </Typography>
        
        <Box sx={{ mb: 4 }}>
          {faqItems.map((item, index) => (
            <Accordion 
              key={index} 
              elevation={0} 
              sx={{ 
                mb: 1, 
                "&:before": { display: "none" },
                bgcolor: "background.default" 
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                  {item.question}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary">
                  {item.answer}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>

        {/* Technical Details Section */}
        <Typography variant="h5" sx={{ mb: 2, color: "primary.main", display: "flex", alignItems: "center" }}>
          <DevicesIcon sx={{ mr: 1 }} />
          Detalii tehnice
        </Typography>
        
        <Box sx={{ mb: 4 }}>
          <Typography variant="body2" paragraph>
            USV Chat este o aplicație web modernă bazată pe următoarele tehnologii:
          </Typography>
          
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
            {techStack.map((tech, index) => (
              <Chip
                key={index}
                label={`${tech.name} v${tech.version}`}
                variant="outlined"
                size="small"
                sx={{ borderRadius: 1 }}
              />
            ))}
          </Box>
          
          <Typography variant="body2" paragraph>
            Aplicația implementează o arhitectură client-server bazată pe Firebase, folosind Firestore pentru baza de date în timp real și autentificare cu Google pentru un proces de login securizat și ușor de utilizat.
          </Typography>
          
          <Typography variant="body2">
            Implementarea criptării end-to-end folosește biblioteca CryptoJS pentru algoritmul AES-256, iar toate cheile de criptare sunt generate și stocate doar la nivelul aplicației client, pentru securitate maximă.
          </Typography>
        </Box>
        
        {/* Footer section */}
        <Divider sx={{ my: 3 }} />
        
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary" paragraph>
            © 2025 Universitatea "Ștefan cel Mare" Suceava - Toate drepturile rezervate
          </Typography>
          
          <Typography variant="body2" color="text.secondary">
            Dezvoltat cu 💙 pentru comunitatea USV
          </Typography>
          
          <Box sx={{ mt: 2, display: "flex", justifyContent: "center", gap: 2 }}>
            <Button
              startIcon={<GitHubIcon />}
              variant="outlined"
              size="small"
              component={Link}
              href="https://github.com/Olar-Alex-Student/university-chat"
              target="_blank"
              rel="noopener noreferrer"
            >
              Cod sursă
            </Button>
            
            <Button
              startIcon={<PrivacyTipIcon />}
              variant="outlined"
              size="small"
            >
              Politica de confidențialitate
            </Button>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default About;