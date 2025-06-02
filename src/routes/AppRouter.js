// src/routes/AppRouter.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Auth from '../components/Auth';
import ChatList from '../components/ChatList';
import Chat from '../components/Chat';
import Profile from '../components/Profile';
import About from '../components/About';
import NotFound from '../components/NotFound';
import ProtectedRoute from './ProtectedRoute';

const AppRouter = ({ initialError }) => {
  const { currentUser } = useAuth();

  return (
    <Routes>
      {/* Ruta pentru autentificare */}
      <Route 
        path="/auth" 
        element={
          !currentUser ? (
            <Auth initialError={initialError} />
          ) : (
            <Navigate to="/" replace />
          )
        } 
      />
      
      {/* Ruta principală - lista de chat-uri (protejată) */}
      <Route 
        path="/university-chat" 
        element={
          <ProtectedRoute>
            <ChatList />
          </ProtectedRoute>
        } 
      />
      
      {/* Chat individual cu un utilizator (protejat) */}
      <Route 
        path="/chat/:userId" 
        element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        } 
      />
      
      {/* Chat de grup (protejat) */}
      <Route 
        path="/group/:groupId" 
        element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        } 
      />
      
      {/* Profil utilizator (protejat) */}
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } 
      />
      
      {/* Despre aplicație (protejat) */}
      <Route 
        path="/about" 
        element={
          <ProtectedRoute>
            <About />
          </ProtectedRoute>
        } 
      />
      
      {/* Pagina 404 */}
      <Route path="/404" element={<NotFound />} />
      
      {/* Redirect pentru rute inexistente */}
      <Route path="/university-chat" element={<Navigate to="/404" replace />} />
    </Routes>
  );
};

export default AppRouter;