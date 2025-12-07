
import React, { useState, useEffect } from 'react';
import { WordPair } from '../../types';
import { Button } from '../Button';
import { RefreshCw, Trophy, Home, ZoomIn, ZoomOut, Clock, Star, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface WordMatchGameProps {
  words: WordPair[];
  onExit: () => void;
}

interface Card {
  id: string; // Unique ID for the card instance
  pairId: string; // ID linking word and meaning
  content: string;
  type: 'word' | 'meaning';
  isMatched: boolean;
  isSelected: boolean;
  isError: boolean;
  isSuccess: boolean; // Added for animation
}

export const WordMatchGame: React.FC<WordMatchGameProps> = ({ words, onExit }) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [score, setScore] = useState(0);
  const [isWon, setIsWon] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  
  // UI Control
  const [zoomLevel, setZoomLevel] = useState(3); // 1 to 5

  // Initialize Game
  useEffect(() => {
    startNewGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer
  useEffect(() => {
    let interval: number;
    if (gameActive && !isWon) {
      interval = window.setInterval(() => {
        setTimeLeft(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameActive, isWon]);

  const startNewGame = () => {
    // MODIFIED: Use ALL words, shuffle them.
    const shuffledWords = [...words].sort(() => 0.5 - Math.random());
    
    const gameCards: Card[] = [];
    shuffledWords.forEach(pair => {
      gameCards.push({
        id: pair.id + '-word',
        pairId: pair.id,
        content: pair.word,
        type: 'word',
        isMatched: false,
        isSelected: false,
        isError: false,
        isSuccess: false
      });
      gameCards.push({
        id: pair.id + '-meaning',
        pairId: pair.id,
        content: pair.meaning,
        type: 'meaning',
        isMatched: false,
        isSelected: false,
        isError: false,
        isSuccess: false
      });
    });

    setCards(gameCards.sort(() => 0.5 - Math.random()));
    setScore(0);
    setTimeLeft(0);
    setIsWon(false);
    setGameActive(true);
    setSelectedCards([]);
  };

  const handleZoom = (direction: 'in' | 'out') => {
      setZoomLevel(prev => {
          if (direction === 'in') return Math.min(prev + 1, 5);
          return Math.max(prev - 1, 1);
      });
  };

  const handleCardClick = (clickedCard: Card) => {
    if (clickedCard.isMatched || clickedCard.isSelected || selectedCards.length >= 2) return;

    const newSelection = [...selectedCards, clickedCard];
    
    // Update selection state visually
    setCards(prev => prev.map(c => c.id === clickedCard.id ? { ...c, isSelected: true } : c));
    setSelectedCards(newSelection);

    if (newSelection.length === 2) {
      const [first, second] = newSelection;
      
      if (first.pairId === second.pairId) {
        // MATCH FOUND!
        
        // 1. Trigger Success Animation first
        setCards(prev => prev.map(c => 
          (c.id === first.id || c.id === second.id) 
            ? { ...c, isSuccess: true, isSelected: false } 
            : c
        ));
        setSelectedCards([]); // Clear selection immediately so user can click others
        setScore(s => s + 100);

        // 2. Wait for animation to finish, then hide cards
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            (c.id === first.id || c.id === second.id) 
              ? { ...c, isMatched: true, isSuccess: false } 
              : c
          ));
          
          // Check win condition
          // We check the 'prev' state effectively by counting matched cards including the ones we just matched
          setCards(currentCards => {
             const remaining = currentCards.filter(c => !c.isMatched).length;
             if (remaining === 0) {
                handleWin();
             }
             return currentCards;
          });
        }, 600); // 600ms match animation
      } else {
        // Mismatch
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            (c.id === first.id || c.id === second.id)
              ? { ...c, isError: true }
              : c
          ));
        }, 200);

        setTimeout(() => {
          setCards(prev => prev.map(c => 
            (c.id === first.id || c.id === second.id)
              ? { ...c, isSelected: false, isError: false }
              : c
          ));
          setSelectedCards([]);
        }, 1000);
      }
    }
  };

  const handleWin = () => {
    setIsWon(true);
    setGameActive(false);
    confetti({
      particleCount: 200,
      spread: 100,
      origin: { y: 0.6 }
    });
  };

  // UI Styling Maps
  const gridColsMap = { 1: 'grid-cols-6', 2: 'grid-cols-5', 3: 'grid-cols-4', 4: 'grid-cols-3', 5: 'grid-cols-2' };
  const fontSizeMap = { 1: 'text-xl', 2: 'text-2xl', 3: 'text-3xl', 4: 'text-4xl', 5: 'text-5xl' };
  const minHeightMap = { 1: 100, 2: 120, 3: 160, 4: 200, 5: 240 };
  
  // @ts-ignore
  const gridColsClass = gridColsMap[zoomLevel];
  // @ts-ignore
  const textSizeClass = fontSizeMap[zoomLevel];
  // @ts-ignore
  const minH = minHeightMap[zoomLevel];

  const remainingPairs = cards.filter(c => !c.isMatched).length / 2;

  return (
    <div className="flex flex-col h-full bg-sky-50 relative overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 opacity-30 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#60A5FA 2px, transparent 2px)', backgroundSize: '40px 40px' }}>
      </div>
      
      {/* Header - Scaled up & Playful */}
      <div className="flex justify-between items-center px-8 py-6 z-10 sticky top-0 bg-sky-50/80 backdrop-blur-md border-b-4 border-sky-100 shadow-sm">
        <div className="flex gap-8 items-center">
            {/* Score Bubble */}
            <div className="bg-white border-b-4 border-yellow-200 rounded-2xl px-6 py-3 flex items-center gap-3 shadow-sm transform hover:scale-105 transition-transform">
                <div className="bg-yellow-100 p-2 rounded-xl">
                    <Star className="text-yellow-500 fill-current" size={28} />
                </div>
                <div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">得分</p>
                    <p className="font-black text-3xl text-yellow-600">{score}</p>
                </div>
            </div>

            {/* Time Bubble */}
            <div className="bg-white border-b-4 border-purple-200 rounded-2xl px-6 py-3 flex items-center gap-3 shadow-sm transform hover:scale-105 transition-transform">
                <div className="bg-purple-100 p-2 rounded-xl">
                    <Clock className="text-purple-500" size={28} />
                </div>
                <div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">时间</p>
                    <p className="font-black text-3xl text-purple-600 tabular-nums">{timeLeft}s</p>
                </div>
            </div>
            
            {/* Progress Pill */}
            <div className="bg-indigo-100 px-6 py-4 rounded-2xl text-indigo-600 font-black text-xl border-b-4 border-indigo-200 shadow-sm">
                剩余 <span className="text-3xl mx-1">{remainingPairs}</span> 组
            </div>
        </div>
        
        <div className="flex items-center gap-6">
             {/* Zoom Controls (Pill Style) */}
             <div className="bg-white p-2 rounded-2xl border-b-4 border-gray-200 shadow-sm flex items-center gap-2">
                <button onClick={() => handleZoom('out')} disabled={zoomLevel <= 1} className="p-3 hover:bg-gray-100 rounded-xl disabled:opacity-30 transition-colors text-gray-500 active:translate-y-1">
                    <ZoomOut size={28} />
                </button>
                <div className="w-px h-8 bg-gray-200"></div>
                <button onClick={() => handleZoom('in')} disabled={zoomLevel >= 5} className="p-3 hover:bg-gray-100 rounded-xl disabled:opacity-30 transition-colors text-gray-500 active:translate-y-1">
                    <ZoomIn size={28} />
                </button>
            </div>

            <button onClick={onExit} className="bg-white text-gray-400 p-4 hover:text-red-500 hover:bg-red-50 rounded-2xl border-b-4 border-gray-200 active:border-b-0 active:translate-y-1 transition-all shadow-sm">
                <Home size={32} />
            </button>
        </div>
      </div>

      {/* Grid - Scrollable Container */}
      <div className="flex-1 overflow-y-auto w-full relative custom-scrollbar p-6">
        <div className={`grid ${gridColsClass} gap-6 pb-40 max-w-[1920px] mx-auto transition-all duration-300`}>
            {cards.map(card => {
                if (card.isMatched) return <div key={card.id} className="invisible" />;
                
                let bgClass = "";
                let animationClass = "";
                
                // State Styling Logic
                if (card.isSuccess) {
                    // Success: Bright Green High-Viz
                    bgClass = "bg-emerald-400 border-emerald-600 text-white shadow-[0_10px_0_rgb(5,150,105)] translate-y-[-10px]";
                    animationClass = "animate-bounce z-20";
                } else if (card.isSelected) {
                    // Selected: Deep Indigo (Active state - Pressed down)
                    bgClass = "bg-indigo-500 border-transparent text-white shadow-none translate-y-[6px] border-b-0 mt-[6px]";
                } else if (card.isError) {
                    // Error: Red
                    bgClass = "bg-red-500 border-red-700 text-white shadow-[0_6px_0_rgb(185,28,28)]";
                    animationClass = "animate-[shake_0.4s_ease-in-out]";
                } else {
                    // Default State based on Type
                    // 3D Button Look: Border Bottom creates the "side" of the button
                    if (card.type === 'word') {
                        // English Word -> Blue
                        bgClass = "bg-blue-100 border-blue-300 text-blue-800 shadow-[0_6px_0_rgb(147,197,253)] hover:translate-y-[2px] hover:shadow-[0_4px_0_rgb(147,197,253)] active:translate-y-[6px] active:shadow-none active:border-b-0 active:mt-[6px]";
                    } else {
                        // Chinese Meaning -> Green
                        bgClass = "bg-green-100 border-green-300 text-green-800 shadow-[0_6px_0_rgb(134,239,172)] hover:translate-y-[2px] hover:shadow-[0_4px_0_rgb(134,239,172)] active:translate-y-[6px] active:shadow-none active:border-b-0 active:mt-[6px]";
                    }
                }

                return (
                    <button
                        key={card.id}
                        onClick={() => handleCardClick(card)}
                        className={`
                            w-full rounded-3xl flex items-center justify-center p-4 border-b-[6px]
                            ${textSizeClass} font-black transition-all duration-100
                            break-words leading-tight relative
                            ${bgClass} ${animationClass}
                        `}
                        style={{ minHeight: `${minH}px` }}
                    >
                        {card.isSuccess && <Sparkles className="absolute -top-4 -right-4 text-yellow-300 w-12 h-12 animate-spin-slow" fill="currentColor" />}
                        {card.content}
                    </button>
                );
            })}
        </div>
      </div>

      {/* Win Modal - Scaled up */}
      {isWon && (
        <div className="fixed inset-0 bg-indigo-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[3rem] p-16 max-w-2xl w-full text-center shadow-2xl animate-[bounce_0.5s_ease-out] border-8 border-yellow-300 relative overflow-hidden">
             {/* Background rays */}
             <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0_25deg,#fff_45deg,transparent_65deg)] animate-[spin_4s_linear_infinite] opacity-10"></div>
             
            <Trophy className="mx-auto text-yellow-400 w-48 h-48 mb-8 drop-shadow-xl relative z-10" fill="currentColor" strokeWidth={1.5} />
            <h2 className="text-7xl font-black text-gray-800 mb-6 relative z-10">大获全胜！</h2>
            <p className="text-4xl text-gray-500 mb-12 font-bold relative z-10">耗时: <span className="text-indigo-600 font-black text-5xl">{timeLeft}</span> 秒</p>
            <div className="space-y-6 relative z-10">
                <Button onClick={startNewGame} fullWidth variant="success" size="xl" className="shadow-xl hover:-translate-y-2">
                    <RefreshCw size={36} className="mr-3" /> 再玩一次
                </Button>
                <Button onClick={onExit} fullWidth variant="secondary" size="xl" className="border-4">
                    返回菜单
                </Button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-8px); }
            75% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  );
};
