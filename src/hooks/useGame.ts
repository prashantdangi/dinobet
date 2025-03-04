import { useState, useEffect, useRef, useCallback } from 'react';

interface GameState {
  isPlaying: boolean;
  score: number;
  highScore: number;
  gameOver: boolean;
}

export function useGame(initialSpeed = 5) {
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    score: 0,
    highScore: 0,
    gameOver: false,
  });
  
  const [speed, setSpeed] = useState(initialSpeed);
  const [obstacles, setObstacles] = useState<Array<{type: 'cactus' | 'bird', id: number, position: number, height?: number}>>([]);
  const [isJumping, setIsJumping] = useState(false);
  const [isDucking, setIsDucking] = useState(false);
  
  const gameLoopRef = useRef<number | null>(null);
  const obstacleIdRef = useRef(0);
  const lastObstacleTimeRef = useRef(0);
  
  const dinoPosition = useRef({ x: 50, y: 0, width: 60, height: isDucking ? 30 : 60 });
  
  const startGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      isPlaying: true,
      score: 0,
      gameOver: false,
    }));
    setSpeed(initialSpeed);
    setObstacles([]);
    obstacleIdRef.current = 0;
    lastObstacleTimeRef.current = 0;
  }, [initialSpeed]);
  
  const endGame = useCallback(() => {
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
    }
    
    setGameState(prev => {
      const newHighScore = Math.max(prev.score, prev.highScore);
      return {
        ...prev,
        isPlaying: false,
        gameOver: true,
        highScore: newHighScore,
      };
    });
  }, []);
  
  const jump = useCallback(() => {
    if (!isJumping && !isDucking && gameState.isPlaying) {
      setIsJumping(true);
      setTimeout(() => {
        setIsJumping(false);
      }, 500);
    }
  }, [isJumping, isDucking, gameState.isPlaying]);
  
  const duck = useCallback(() => {
    if (!isDucking && gameState.isPlaying) {
      setIsDucking(true);
      dinoPosition.current.height = 30;
    }
  }, [isDucking, gameState.isPlaying]);
  
  const stopDucking = useCallback(() => {
    if (isDucking) {
      setIsDucking(false);
      dinoPosition.current.height = 60;
    }
  }, [isDucking]);
  
  // Handle keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.code === 'Space' || e.code === 'ArrowUp') && gameState.isPlaying) {
        jump();
      } else if (e.code === 'ArrowDown' && gameState.isPlaying) {
        duck();
      } else if (e.code === 'Enter' && !gameState.isPlaying) {
        startGame();
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowDown') {
        stopDucking();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [jump, duck, stopDucking, startGame, gameState.isPlaying]);
  
  // Game loop
  useEffect(() => {
    if (!gameState.isPlaying) return;
    
    const gameLoop = () => {
      // Update score
      setGameState(prev => ({
        ...prev,
        score: prev.score + 1,
      }));
      
      // Increase speed based on score
      if (gameState.score % 100 === 0) {
        setSpeed(prev => Math.min(prev + 0.5, 20));
      }
      
      // Generate obstacles
      const now = Date.now();
      if (now - lastObstacleTimeRef.current > 1500 + Math.random() * 1000) {
        const newObstacle = {
          type: Math.random() > 0.3 ? 'cactus' : 'bird',
          id: obstacleIdRef.current++,
          position: 0,
          height: Math.random() > 0.5 ? 50 : 100, // Only for birds
        };
        
        setObstacles(prev => [...prev, newObstacle]);
        lastObstacleTimeRef.current = now;
      }
      
      // Move obstacles
      setObstacles(prev => {
        return prev
          .map(obstacle => ({
            ...obstacle,
            position: obstacle.position + speed,
          }))
          .filter(obstacle => obstacle.position < 100);
      });
      
      // Check collisions
      const dinoRect = {
        x: dinoPosition.current.x,
        y: isJumping ? 100 : 0,
        width: dinoPosition.current.width,
        height: dinoPosition.current.height,
      };
      
      const collision = obstacles.some(obstacle => {
        const obstacleRect = {
          x: 100 - obstacle.position,
          y: obstacle.type === 'bird' ? (obstacle.height || 0) : 0,
          width: obstacle.type === 'cactus' ? 30 : 60,
          height: obstacle.type === 'cactus' ? 60 : 40,
        };
        
        return (
          dinoRect.x < obstacleRect.x + obstacleRect.width &&
          dinoRect.x + dinoRect.width > obstacleRect.x &&
          dinoRect.y < obstacleRect.y + obstacleRect.height &&
          dinoRect.y + dinoRect.height > obstacleRect.y
        );
      });
      
      if (collision) {
        endGame();
        return;
      }
      
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };
    
    gameLoopRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState.isPlaying, isJumping, obstacles, speed, endGame, gameState.score]);
  
  return {
    gameState,
    isJumping,
    isDucking,
    obstacles,
    jump,
    duck,
    stopDucking,
    startGame,
    endGame,
  };
}