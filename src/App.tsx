import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthState } from './hooks/useAuthState';
import Login from './pages/Login';
import Game from './pages/Game';
import Bet from './pages/Bet';
import Payout from './pages/Payout';
import Header from './components/Header';

function App() {
  const { user, loading } = useAuthState();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Routes>
        <Route path="/" element={user ? <Navigate to="/bet" /> : <Login />} />
        <Route path="/bet" element={user ? <Bet /> : <Navigate to="/" />} />
        <Route path="/game" element={user ? <Game /> : <Navigate to="/" />} />
        <Route path="/payout" element={user ? <Payout /> : <Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default App;