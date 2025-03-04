import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from '../hooks/useAuthState';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { LogOut, Trophy } from 'lucide-react';

const Header: React.FC = () => {
  const { user } = useAuthState();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="bg-black text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <Trophy size={24} />
          <h1 className="text-xl font-bold">Dino Betting Game</h1>
        </div>
        
        {user && (
          <div className="flex items-center space-x-4">
            <span className="text-sm">{user.phoneNumber}</span>
            <button 
              onClick={handleLogout}
              className="flex items-center space-x-1 text-sm bg-white text-black px-2 py-1 rounded hover:bg-gray-200"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;