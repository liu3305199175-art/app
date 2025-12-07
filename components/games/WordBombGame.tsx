
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { WordPair } from '../../types';
import { Button } from '../Button';
import { Bomb, Home, Zap, Heart, CheckCircle, Flag, Scissors, AlertTriangle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface WordBombGameProps {
  words: WordPair[];
  onExit: () => void;
}

export const WordBombGame: React.FC<WordBombGameProps> = ({ words, onExit }) => {
  // Game State
  const [remainingWords, setRemainingWords] = useState<WordPair[]>([...words]);
  const [lives, setLives] = useState(5);
  const [timer, setTimer] = useState(30.0);
  const [gameState, setGameState] = useState<'playing' | 'gameover' | 'won'>('playing');
  
  // Current question data
  const [targetWord, setTargetWord] = useState<WordPair | null>(null);
  const [options, setOptions] = useState<WordPair[]>([]);
  const [shake, setShake] = useState(false);
  const [bgIntensity, setBgIntensity] = useState('bg-emerald-50');

  // Refs for safety
  const timerRef = useRef<number | null>(null);

  // Background color logic based on timer
  useEffect(() => {
    if (timer > 20) setBgIntensity('bg-emerald-50');
    else if (timer > 10) setBgIntensity('bg-yellow-50');
    else setBgIntensity('bg-red-50');
  }, [timer]);

  // Generate a round using the REMAINING words
  const generateRound = useCallback((currentRemaining: WordPair[]) => {
    if (lives <= 0) return;
    if (currentRemaining.length === 0) {
        handleWin();
        return;
    }

    // Pick target from REMAINING words
    const randomTarget = currentRemaining[Math.floor(Math.random() * currentRemaining.length)];
    
    // Pick 3 distractors from the FULL list (excluding the target)
    const distractors = words
      .filter(w => w.id !== randomTarget.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    
    // Combine and shuffle
    const roundOptions = [randomTarget, ...distractors].sort(() => 0.5 - Math.random());

    setTargetWord(randomTarget);
    setOptions(roundOptions);
    setTimer(30.0); // Reset timer
  }, [words, lives]);

  // Initial Start
  useEffect(() => {
    setRemainingWords([...words]);
    generateRound([...words]);
    return () => stopTimer();
  }, []);

  const stopTimer = () => {
    if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
    }
  };

  // Timer Tick
  useEffect(() => {
    if (gameState === 'playing' && timer > 0) {
      timerRef.current = window.setInterval(() => {
        setTimer(prev => {
          if (prev <= 0.1) {
            handleLifeLost();
            return 0;
          }
          return prev - 0.1;
        });
      }, 100);
    }
    return () => stopTimer();
  }, [gameState, timer]);

  const handleWin = () => {
      setGameState('won');
      stopTimer();
      confetti({
        particleCount: 300,
        spread: 120,
        origin: { y: 0.6 },
        colors: ['#34D399', '#10B981', '#FFD700']
      });
  };

  const handleLifeLost = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);

    if (lives > 1) {
      setLives(l => l - 1);
      // We don't change the word on timeout/error, user must try again or lose all lives
      setTimer(30.0); 
    } else {
      setLives(0);
      setGameState('gameover');
      stopTimer();
    }
  };

  const handleOptionClick = (selectedWord: WordPair) => {
    if (gameState !== 'playing') return;

    if (selectedWord.id === targetWord?.id) {
      // Correct! Remove this word from the remaining pool
      const newRemaining = remainingWords.filter(w => w.id !== targetWord.id);
      setRemainingWords(newRemaining);

      if (newRemaining.length === 0) {
          handleWin();
      } else {
          // Play small success effect
          confetti({
            particleCount: 30,
            spread: 50,
            origin: { y: 0.8 },
            colors: ['#34D399', '#10B981']
          });
          generateRound(newRemaining);
      }
    } else {
      // Wrong
      handleLifeLost();
    }
  };

  const retry = () => {
    setRemainingWords([...words]);
    setLives(5);
    setGameState('playing');
    generateRound([...words]);
  };

  if (!targetWord && gameState === 'playing') return <div className="p-10 text-center text-3xl">Loading...</div>;

  return (
    <div className={`flex flex-col h-full transition-colors duration-1000 ${bgIntensity} font-sans relative overflow-hidden`}>
      {/* Background Danger Stripes if time is low */}
      {timer < 10 && (
          <div className="absolute inset-0 opacity-10 pointer-events-none" 
               style={{ backgroundImage: 'repeating-linear-gradient(45deg, #ef4444 0, #ef4444 20px, transparent 20px, transparent 40px)' }}>
          </div>
      )}

      {/* Header */}
      <div className="px-8 py-6 flex justify-between items-center bg-white/80 backdrop-blur-sm shadow-sm h-28 z-10 border-b-4 border-gray-100">
        <div className="flex gap-3 text-red-500 bg-red-50 p-3 rounded-2xl border-2 border-red-100">
          {[...Array(5)].map((_, i) => (
             <Heart 
                key={i} 
                size={36} 
                fill={i < lives ? "currentColor" : "none"} 
                className={`transition-all duration-300 ${i < lives ? "scale-100" : "scale-75 opacity-20"}`} 
             />
          ))}
        </div>
        
        {/* Progress Display */}
        <div className="flex items-center gap-4 bg-gray-800 text-white px-8 py-3 rounded-2xl shadow-lg transform -skew-x-12">
            <div className="skew-x-12 flex items-center gap-4">
                <span className="text-gray-300 text-lg font-bold uppercase tracking-widest">目标剩余</span>
                <span className="text-4xl font-black text-white tabular-nums">
                    {remainingWords.length}
                </span>
            </div>
        </div>

        <button onClick={onExit} className="text-gray-400 p-4 hover:bg-gray-100 rounded-2xl border-2 border-transparent hover:border-gray-200 transition-colors">
          <Home size={40} />
        </button>
      </div>

      {/* Game Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative z-10">
        
        {/* The Bomb / Timer Container */}
        <div className={`relative mb-8 transition-transform ${shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
           {/* Fuse Spark */}
           <div className="absolute -top-12 left-1/2 -translate-x-1/2">
                <div className={`w-2 h-12 bg-gray-800 mx-auto ${timer < 5 ? 'animate-bounce' : ''}`}></div>
                <Zap size={32} className={`text-yellow-400 absolute -top-4 left-1/2 -translate-x-1/2 ${gameState === 'playing' ? 'animate-pulse' : 'hidden'}`} fill="currentColor" />
           </div>

           <div className={`
                w-64 h-64 rounded-full flex items-center justify-center border-[16px] shadow-2xl relative
                ${timer < 10 ? 'border-red-500 bg-red-50' : 'border-gray-800 bg-white'}
                transition-colors duration-500
           `}>
              <div className="text-center z-10">
                 <Bomb className={`mx-auto mb-2 ${timer < 10 ? 'text-red-500 animate-bounce' : 'text-gray-800'}`} size={64} fill={timer < 10 ? "currentColor" : "none"} />
                 <span className={`text-6xl font-black font-mono block tracking-tighter ${timer < 10 ? 'text-red-600' : 'text-gray-800'}`}>
                    {timer.toFixed(1)}
                 </span>
              </div>
           </div>
        </div>

        {/* The Target Word Panel */}
        <div className="bg-white px-16 py-12 rounded-[3rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] border-b-8 border-gray-200 mb-10 w-full max-w-4xl text-center transform hover:scale-[1.02] transition-transform relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400"></div>
          <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-500 px-4 py-1 rounded-full text-sm font-bold uppercase tracking-widest mb-4">
            <AlertTriangle size={16} /> 待拆除词汇
          </div>
          <h1 className="text-7xl font-black text-gray-800 break-words leading-tight drop-shadow-sm">
            {targetWord?.word}
          </h1>
        </div>

        {/* Options (Wires to cut) */}
        <div className="grid grid-cols-2 gap-6 w-full max-w-5xl px-4">
          {options.map((opt, idx) => {
              // Different colors for wires
              const colors = [
                  'bg-rose-500 border-rose-700 shadow-rose-200', 
                  'bg-blue-500 border-blue-700 shadow-blue-200', 
                  'bg-amber-500 border-amber-700 shadow-amber-200', 
                  'bg-violet-500 border-violet-700 shadow-violet-200'
              ];
              const colorClass = colors[idx % 4];

              return (
                <button
                key={opt.id}
                onClick={() => handleOptionClick(opt)}
                disabled={gameState !== 'playing'}
                className={`
                    relative group overflow-hidden
                    ${colorClass} border-b-[10px] active:border-b-0 active:translate-y-[10px] active:mt-[10px]
                    text-white p-6 rounded-3xl font-black shadow-xl transition-all
                    text-4xl leading-tight h-44 flex items-center justify-center
                `}
                >
                <div className="absolute top-4 right-4 opacity-50 group-hover:opacity-100 transition-opacity">
                    <Scissors size={32} />
                </div>
                <span className="drop-shadow-md">{opt.meaning}</span>
                </button>
              );
          })}
        </div>
      </div>

      {/* Game Over Overlay */}
      {gameState === 'gameover' && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 z-50 text-white animate-in fade-in duration-300">
          <div className="relative">
              <div className="absolute inset-0 bg-red-500 blur-3xl opacity-20 animate-pulse rounded-full"></div>
              <Bomb size={140} className="text-red-500 mb-8 animate-[bounce_0.5s_infinite] relative z-10" fill="currentColor" />
          </div>
          <h2 className="text-9xl font-black mb-6 text-red-500 tracking-tighter">爆炸了！</h2>
          <p className="text-4xl text-gray-300 mb-12 font-bold">还有 {remainingWords.length} 个炸弹未拆除</p>
          
          <div className="space-y-8 w-full max-w-lg">
            <Button onClick={retry} fullWidth variant="success" size="xl" className="shadow-[0_0_30px_rgba(16,185,129,0.4)]">
               <Zap size={36} className="mr-3" /> 再试一次
            </Button>
            <Button onClick={onExit} fullWidth variant="secondary" size="xl" className="!bg-transparent !text-white !border-white/30 hover:!bg-white/10">
               退出游戏
            </Button>
          </div>
        </div>
      )}

      {/* Victory Overlay */}
      {gameState === 'won' && (
        <div className="absolute inset-0 bg-emerald-500/95 flex flex-col items-center justify-center p-6 z-50 text-white animate-in zoom-in duration-300">
          <div className="bg-white p-10 rounded-full mb-8 shadow-2xl animate-[spin_3s_linear_infinite_reverse]">
             <CheckCircle size={120} className="text-emerald-500" fill="#ecfdf5" />
          </div>
          <h2 className="text-9xl font-black mb-4 text-white drop-shadow-md tracking-tight">危机解除!</h2>
          <p className="text-4xl text-emerald-100 mb-12 max-w-2xl text-center font-bold leading-relaxed">
            你成功拆除了所有的单词炸弹，保护了世界和平！
          </p>
          
          <div className="space-y-8 w-full max-w-lg">
            <Button onClick={retry} fullWidth size="xl" className="bg-white text-emerald-600 hover:bg-emerald-50 border-b-8 border-emerald-200">
               <Flag size={36} className="mr-3" /> 重新挑战
            </Button>
            <Button onClick={onExit} fullWidth variant="secondary" size="xl" className="!bg-transparent !text-white !border-white/30 hover:!bg-white/10">
               返回主菜单
            </Button>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-10px) rotate(-5deg); }
            40% { transform: translateX(10px) rotate(5deg); }
            60% { transform: translateX(-10px) rotate(-5deg); }
            80% { transform: translateX(10px) rotate(5deg); }
        }
      `}</style>
    </div>
  );
};
