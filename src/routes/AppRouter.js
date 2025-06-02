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

  if (!currentUser) {
    return <Auth initialError={initialError} />;
  }

  return (
    <Routes>
      {/* Ruta principală - lista de chat-uri */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <ChatList />
          </ProtectedRoute>
        } 
      />
      
      {/* Chat individual cu un utilizator */}
      <Route 
        path="/chat/:userId" 
        element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        } 
      />
      
      {/* Chat de grup */}
      <Route 
        path="/group/:groupId" 
        element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        } 
      />
      
      {/* Profil utilizator */}
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } 
      />
      
      {/* Despre aplicație */}
      <Route 
        path="/about" 
        element={
          <ProtectedRoute>
            <About />
          </ProtectedRoute>
        } 
      />
      
      {/* Redirecționare pentru rute inexistente */}
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
};

export default AppRouter;