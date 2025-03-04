import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useGame } from '../hooks/useGame';
import { Trophy, RefreshCw } from 'lucide-react';

const Game: React.FC = () => {
  const navigate = useNavigate();
  const gameContainerRef = useRef<HTMLDivElement>(null);
  
  const {
    gameState,
    isJumping,
    isDucking,
    obstacles,
    jump,
    duck,
    stopDucking,
    startGame,
    endGame,
  } = useGame();
  
  // Start game on component mount
  useEffect(() => {
    startGame();
  }, [startGame]);
  
  // Handle touch controls for mobile
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (!gameState.isPlaying) return;
      
      const touchY = e.touches[0].clientY;
      const containerHeight = gameContainerRef.current?.clientHeight || 0;
      const touchPosition = touchY / containerHeight;
      
      if (touchPosition < 0.5) {
        jump();
      } else {
        duck();
      }
    };
    
    const handleTouchEnd = () => {
      stopDucking();
    };
    
    const container = gameContainerRef.current;
    if (container) {
      container.addEventListener('touchstart', handleTouchStart);
      container.addEventListener('touchend', handleTouchEnd);
    }
    
    return () => {
      if (container) {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [jump, duck, stopDucking, gameState.isPlaying]);
  
  // Save score to Firestore when game ends
  useEffect(() => {
    if (gameState.gameOver && auth.currentUser) {
      const saveScore = async () => {
        try {
          await updateDoc(doc(db, 'games', auth.currentUser!.uid), {
            score: gameState.score,
            status: 'completed',
            endTime: new Date(),
          });
          
          // Navigate to payout page after a short delay
          setTimeout(() => {
            navigate('/payout');
          }, 2000);
        } catch (error) {
          console.error('Error saving score:', error);
        }
      };
      
      saveScore();
    }
  }, [gameState.gameOver, gameState.score, navigate]);
  
  // Calculate earnings
  const earnings = Math.floor(gameState.score / 10);
  
  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center bg-white p-4">
      <div className="w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-sm font-medium">Score</p>
            <p className="text-2xl font-bold">{gameState.score}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium">High Score</p>
            <p className="text-2xl font-bold">{gameState.highScore}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium">Earnings</p>
            <p className="text-2xl font-bold">₹{earnings}</p>
          </div>
        </div>
        
        <div 
          ref={gameContainerRef}
          className="game-container bg-white relative"
        >
          {/* Dino character */}
          <div className={`dino ${isJumping ? 'jump' : ''} ${isDucking ? 'duck' : ''}`} style={{ left: '50px' }}></div>
          
          {/* Ground */}
          <div className="ground"></div>
          
          {/* Obstacles */}
          {obstacles.map(obstacle => (
            <div 
              key={obstacle.id}
              className={`obstacle ${obstacle.type}`}
              style={{ 
                right: `${obstacle.position}%`,
                bottom: obstacle.type === 'bird' ? `${obstacle.height}px` : '0',
                animationDuration: `${3 - gameState.score / 1000}s`
              }}
            ></div>
          ))}
          
          {/* Clouds for decoration */}
          <div className="cloud" style={{ top: '20px', animationDuration: '15s' }}></div>
          <div className="cloud" style={{ top: '50px', animationDuration: '20s' }}></div>
          
          {/* Game over overlay */}
          {gameState.gameOver && (
            <div className="game-over">
              <Trophy size={48} className="mx-auto mb-4 text-black" />
              <h2 className="text-2xl font-bold mb-2">Game Over!</h2>
              <p className="text-lg mb-4">Your score: {gameState.score}</p>
              <p className="text-lg mb-4">You earned: ₹{earnings}</p>
              <p className="text-sm mb-4">Redirecting to payout page...</p>
            </div>
          )}
          
          {/* Instructions overlay */}
          {!gameState.isPlaying && !gameState.gameOver && (
            <div className="game-over">
              <h2 className="text-2xl font-bold mb-4">Chrome Dino Game</h2>
              <p className="mb-4">Press Space/Up Arrow to jump</p>
              <p className="mb-4">Press Down Arrow to duck</p>
              <button onClick={startGame} className="btn flex items-center justify-center mx-auto">
                <RefreshCw size={16} className="mr-2" />
                Start Game
              </button>
            </div>
          )}
        </div>
        
        <div className="mt-4 text-center text-sm text-gray-600">
          <p>Tap top half of screen to jump, bottom half to duck</p>
        </div>
      </div>
    </div>
  );
};

export default Game;