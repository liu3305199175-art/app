
import React, { useState, useEffect, useRef } from 'react';
import { WordPair } from '../../types';
import { Button } from '../Button';
import { RefreshCw, Trophy, Home, Heart, Swords, Snowflake, Lock, ZoomIn, ZoomOut, Zap, CloudFog, Sparkles, XCircle, Clock, Star, Play } from 'lucide-react';
import confetti from 'canvas-confetti';

interface WordMatchPKGameProps {
  words: WordPair[];
  onExit: () => void;
}

interface Card {
  id: string; 
  pairId: string;
  content: string;
  type: 'word' | 'meaning';
  isMatched: boolean;
  isSelected: boolean;
  isError: boolean;
  isSuccess: boolean;
}

interface PlayerState {
  id: 1 | 2;
  hp: number;
  score: number; // Added Score
  cards: Card[];
  selectedCards: Card[];
  isFrozen: boolean;
  isFrozenBySkill: boolean;
  
  // Skill System
  skillCharges: number;
  streak: number;
  
  // Cooldowns
  freezeCooldown: number;
  mistCooldown: number;
  
  // Active Effects
  mistedCardIds: string[];
  
  // UI Customization
  zoomLevel: number;
}

type GameStatus = 'setup' | 'playing' | 'finished';

export const WordMatchPKGame: React.FC<WordMatchPKGameProps> = ({ words, onExit }) => {
  const [gameStatus, setGameStatus] = useState<GameStatus>('setup');
  const [selectedDuration, setSelectedDuration] = useState(180); // Default 3 mins
  const [timeLeft, setTimeLeft] = useState(180);
  
  const [p1State, setP1State] = useState<PlayerState | null>(null);
  const [p2State, setP2State] = useState<PlayerState | null>(null);
  const [gameResult, setGameResult] = useState<{ winner: 1 | 2 | 'draw', reason: 'hp' | 'clear' | 'time' } | null>(null);

  // Refs
  const p1FreezeTimer = useRef<number | null>(null);
  const p2FreezeTimer = useRef<number | null>(null);
  const p1MistTimer = useRef<number | null>(null);
  const p2MistTimer = useRef<number | null>(null);
  const gameTimerRef = useRef<number | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
        clearAllTimers();
    };
  }, []);

  const clearAllTimers = () => {
    if (p1FreezeTimer.current) clearTimeout(p1FreezeTimer.current);
    if (p2FreezeTimer.current) clearTimeout(p2FreezeTimer.current);
    if (p1MistTimer.current) clearTimeout(p1MistTimer.current);
    if (p2MistTimer.current) clearTimeout(p2MistTimer.current);
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
  };

  // Cooldown Timer Logic (Runs every second)
  useEffect(() => {
    const interval = setInterval(() => {
        if (gameStatus !== 'playing') return;
        
        const updateCooldowns = (prev: PlayerState | null) => {
            if (!prev) return null;
            return {
                ...prev,
                freezeCooldown: prev.freezeCooldown > 0 ? prev.freezeCooldown - 1 : 0,
                mistCooldown: prev.mistCooldown > 0 ? prev.mistCooldown - 1 : 0
            };
        };
        setP1State(updateCooldowns);
        setP2State(updateCooldowns);
    }, 1000);
    return () => clearInterval(interval);
  }, [gameStatus]);

  // Main Game Timer
  useEffect(() => {
    if (gameStatus === 'playing') {
        gameTimerRef.current = window.setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    handleTimeOut();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }
    return () => {
        if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    };
  }, [gameStatus]);

  const handleTimeOut = () => {
      if (!p1State || !p2State) return;
      
      // Determine winner by score
      let winner: 1 | 2 | 'draw' = 'draw';
      if (p1State.score > p2State.score) winner = 1;
      else if (p2State.score > p1State.score) winner = 2;
      
      handleGameEnd(winner, 'time');
  };

  const generatePlayerCards = (playerId: number): Card[] => {
    const shuffledWords = [...words].sort(() => 0.5 - Math.random());
    const gameCards: Card[] = [];
    shuffledWords.forEach(pair => {
      gameCards.push({
        id: `${playerId}-${pair.id}-word`,
        pairId: pair.id,
        content: pair.word,
        type: 'word',
        isMatched: false,
        isSelected: false,
        isError: false,
        isSuccess: false
      });
      gameCards.push({
        id: `${playerId}-${pair.id}-meaning`,
        pairId: pair.id,
        content: pair.meaning,
        type: 'meaning',
        isMatched: false,
        isSelected: false,
        isError: false,
        isSuccess: false
      });
    });
    return gameCards.sort(() => 0.5 - Math.random());
  };

  const initGame = () => {
    setGameResult(null);
    clearAllTimers();
    setTimeLeft(selectedDuration);

    const initialState = (id: 1 | 2): PlayerState => ({
      id,
      hp: 100,
      score: 0,
      cards: generatePlayerCards(id),
      selectedCards: [],
      isFrozen: false,
      isFrozenBySkill: false,
      skillCharges: 0,
      streak: 0,
      freezeCooldown: 0,
      mistCooldown: 0,
      mistedCardIds: [],
      zoomLevel: 3
    });

    setP1State(initialState(1));
    setP2State(initialState(2));
    setGameStatus('playing');
  };

  const checkWinCondition = (p1: PlayerState, p2: PlayerState) => {
    if (p1.hp <= 0) { handleGameEnd(2, 'hp'); return; }
    if (p2.hp <= 0) { handleGameEnd(1, 'hp'); return; }

    const p1Remaining = p1.cards.filter(c => !c.isMatched).length;
    const p2Remaining = p2.cards.filter(c => !c.isMatched).length;

    if (p1Remaining === 0) { handleGameEnd(1, 'clear'); } 
    else if (p2Remaining === 0) { handleGameEnd(2, 'clear'); }
  };

  const handleGameEnd = (winner: 1 | 2 | 'draw', reason: 'hp' | 'clear' | 'time') => {
    setGameResult({ winner, reason });
    setGameStatus('finished');
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);

    if (winner !== 'draw') {
        const originX = winner === 1 ? 0.25 : 0.75;
        confetti({
          particleCount: 200,
          spread: 100,
          origin: { x: originX, y: 0.6 },
          colors: winner === 1 ? ['#3B82F6', '#60A5FA'] : ['#EC4899', '#F472B6']
        });
    }
  };

  // --- Skill Logic ---
  const handleCastSkill = (casterId: 1 | 2, skillType: 'freeze' | 'mist') => {
    const casterState = casterId === 1 ? p1State : p2State;
    const setCasterState = casterId === 1 ? setP1State : setP2State;
    const setOpponentState = casterId === 1 ? setP2State : setP1State;
    
    // Timer Refs
    const opponentFreezeTimer = casterId === 1 ? p2FreezeTimer : p1FreezeTimer;
    const opponentMistTimer = casterId === 1 ? p2MistTimer : p1MistTimer;

    if (!casterState) return;

    // Cost and Cooldown Checks
    const cost = 3; 
    const cooldown = skillType === 'mist' ? casterState.mistCooldown : casterState.freezeCooldown;

    if (casterState.skillCharges < cost) return;
    if (cooldown > 0) return;

    // 1. Consume Charge & Set Cooldown
    setCasterState(prev => prev ? ({ 
        ...prev, 
        skillCharges: prev.skillCharges - cost,
        freezeCooldown: skillType === 'freeze' ? 10 : prev.freezeCooldown, 
        mistCooldown: skillType === 'mist' ? 10 : prev.mistCooldown 
    }) : null);

    // 2. Apply Effect
    if (skillType === 'freeze') {
        setOpponentState(prev => prev ? ({ ...prev, isFrozenBySkill: true }) : null);
        if (opponentFreezeTimer.current) clearTimeout(opponentFreezeTimer.current);
        opponentFreezeTimer.current = window.setTimeout(() => {
            setOpponentState(prev => prev ? ({ ...prev, isFrozenBySkill: false }) : null);
        }, 3000); 
    } 
    else if (skillType === 'mist') {
        setOpponentState(prev => {
            if (!prev) return null;
            const availableCards = prev.cards.filter(c => !c.isMatched).map(c => c.id);
            const shuffled = availableCards.sort(() => 0.5 - Math.random());
            const cardsToMist = shuffled.slice(0, 3);
            return { ...prev, mistedCardIds: cardsToMist };
        });

        if (opponentMistTimer.current) clearTimeout(opponentMistTimer.current);
        opponentMistTimer.current = window.setTimeout(() => {
            setOpponentState(prev => prev ? ({ ...prev, mistedCardIds: [] }) : null);
        }, 6000); 
    }
  };

  const handleZoom = (playerId: 1 | 2, direction: 'in' | 'out') => {
      const setPlayerState = playerId === 1 ? setP1State : setP2State;
      setPlayerState(prev => {
          if(!prev) return null;
          let newZoom = prev.zoomLevel;
          if (direction === 'in') newZoom = Math.min(prev.zoomLevel + 1, 5);
          if (direction === 'out') newZoom = Math.max(prev.zoomLevel - 1, 1);
          return { ...prev, zoomLevel: newZoom };
      });
  };

  const handleCardClick = (playerNum: 1 | 2, clickedCard: Card) => {
    if (gameStatus !== 'playing') return;
    
    const currentState = playerNum === 1 ? p1State : p2State;
    const setPlayerState = playerNum === 1 ? setP1State : setP2State;
    const opponentState = playerNum === 1 ? p2State : p1State;

    if (!currentState || !opponentState) return;
    if (currentState.isFrozen || currentState.isFrozenBySkill) return; 
    
    if (clickedCard.isMatched || clickedCard.isSelected || currentState.selectedCards.length >= 2) return;

    const newSelection = [...currentState.selectedCards, clickedCard];
    
    setPlayerState(prev => prev ? ({
      ...prev,
      cards: prev.cards.map(c => c.id === clickedCard.id ? { ...c, isSelected: true } : c),
      selectedCards: newSelection
    }) : null);

    if (newSelection.length === 2) {
      const [first, second] = newSelection;
      
      if (first.pairId === second.pairId) {
        // --- MATCH SUCCESS ---
        const originX = playerNum === 1 ? 0.25 : 0.75;
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { x: originX, y: 0.5 },
          colors: playerNum === 1 ? ['#60A5FA', '#3B82F6'] : ['#F472B6', '#EC4899'],
          disableForReducedMotion: true,
          ticks: 100
        });

        setPlayerState(prev => {
            if (!prev) return null;
            
            // Skill & Score Logic
            const newStreak = prev.streak + 1;
            const newCharges = Math.min(prev.skillCharges + 1, 10);
            const newScore = prev.score + 100; // +100 Points

            return {
                ...prev,
                score: newScore,
                streak: newStreak,
                skillCharges: newCharges,
                mistedCardIds: prev.mistedCardIds.filter(id => id !== first.id && id !== second.id),
                cards: prev.cards.map(c => 
                    (c.id === first.id || c.id === second.id) ? { ...c, isSuccess: true, isSelected: false } : c
                ),
                selectedCards: []
            };
        });

        setTimeout(() => {
          setPlayerState(prev => {
            if (!prev) return null;
            const updated = {
              ...prev,
              cards: prev.cards.map(c => 
                (c.id === first.id || c.id === second.id) 
                  ? { ...c, isMatched: true, isSuccess: false } 
                  : c
              ),
            };
            checkWinCondition(
                playerNum === 1 ? updated : opponentState,
                playerNum === 2 ? updated : opponentState
            );
            return updated;
          });
        }, 250);
      } else {
        // --- MATCH FAIL ---
        setPlayerState(prev => prev ? ({
            ...prev,
            isFrozen: true,
            streak: 0,
            cards: prev.cards.map(c => 
                (c.id === first.id || c.id === second.id) ? { ...c, isError: true } : c
            )
        }) : null);

        setTimeout(() => {
           setPlayerState(prev => {
               if (!prev) return null;
               const newHp = prev.hp - 10;
               const updated = {
                   ...prev,
                   hp: newHp,
                   isFrozen: false,
                   cards: prev.cards.map(c => 
                    (c.id === first.id || c.id === second.id) ? { ...c, isSelected: false, isError: false } : c
                   ),
                   selectedCards: []
               };
               checkWinCondition(
                playerNum === 1 ? updated : opponentState,
                playerNum === 2 ? updated : opponentState
               );
               return updated;
           });
        }, 1000);
      }
    }
  };

  // --- RENDERERS ---

  const renderSetupScreen = () => (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-indigo-900/90 backdrop-blur-md animate-in fade-in">
        <div className="bg-white rounded-[3rem] p-12 max-w-3xl w-full text-center shadow-2xl border-8 border-indigo-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-6 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500"></div>
            
            <Swords size={80} className="mx-auto text-indigo-500 mb-6" />
            <h2 className="text-6xl font-black text-indigo-900 mb-2">双人对战设置</h2>
            <p className="text-xl text-gray-500 font-bold mb-10">选择本局比赛时长</p>
            
            <div className="flex flex-wrap justify-center gap-4 mb-12">
                {[60, 120, 180, 240, 300].map(seconds => (
                    <button
                        key={seconds}
                        onClick={() => setSelectedDuration(seconds)}
                        className={`
                            px-6 py-4 rounded-2xl font-black text-2xl border-b-4 transition-all active:border-b-0 active:translate-y-1
                            ${selectedDuration === seconds 
                                ? 'bg-indigo-500 border-indigo-700 text-white shadow-lg scale-105' 
                                : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'}
                        `}
                    >
                        {seconds}s
                    </button>
                ))}
            </div>

            <Button onClick={initGame} size="xl" fullWidth className="shadow-xl shadow-indigo-200">
                <Play size={36} fill="currentColor" className="mr-3" /> 开始对决
            </Button>
            
            <button onClick={onExit} className="mt-8 text-gray-400 font-bold hover:text-red-500 transition-colors">
                返回菜单
            </button>
        </div>
    </div>
  );

  const renderBoard = (state: PlayerState, colorTheme: 'blue' | 'pink') => {
    const isBlue = colorTheme === 'blue';
    const borderColor = isBlue ? 'border-blue-400' : 'border-pink-400';
    const bgColor = isBlue ? 'bg-blue-50' : 'bg-pink-50';
    const headerColor = isBlue ? 'bg-blue-500' : 'bg-pink-500';
    
    // UI Sizing Logic
    const gridColsMap = { 1: 5, 2: 4, 3: 3, 4: 2, 5: 2 };
    const fontSizeMap = { 1: 'text-sm', 2: 'text-base', 3: 'text-xl', 4: 'text-3xl', 5: 'text-4xl' };
    const minHeightMap = { 1: 60, 2: 80, 3: 110, 4: 140, 5: 160 };
    // @ts-ignore
    const cols = gridColsMap[state.zoomLevel];
    // @ts-ignore
    const textSize = fontSizeMap[state.zoomLevel];
    // @ts-ignore
    const minH = minHeightMap[state.zoomLevel];

    return (
      <div className={`flex-1 flex flex-col p-2 md:p-4 border-8 rounded-[2.5rem] ${borderColor} ${bgColor} relative overflow-hidden shadow-2xl`}>
         
         {/* --- Status Header --- */}
         <div className={`${headerColor} p-4 rounded-[1.5rem] mb-4 flex items-center justify-between text-white shadow-lg border-b-4 border-black/20 z-10 relative`}>
             <div className="flex items-center gap-3">
                 <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                    {isBlue ? <UserIcon /> : <UserIcon2 />}
                 </div>
                 <div className="flex flex-col">
                     <span className="text-xs font-bold opacity-80 uppercase tracking-widest">Player</span>
                     <span className="text-3xl font-black leading-none">P{state.id}</span>
                 </div>
             </div>
             
             {/* Score Display */}
             <div className="flex flex-col items-center">
                 <span className="text-[10px] font-bold opacity-80 uppercase tracking-widest">SCORE</span>
                 <span className="text-3xl font-black tabular-nums leading-none">{state.score}</span>
             </div>

             {/* HP Bar */}
             <div className="flex flex-col items-end w-24 md:w-32">
                <div className="flex items-center gap-2 mb-1">
                    <Heart size={14} className="text-white fill-current" />
                    <span className="font-black text-xs">{Math.max(0, state.hp)}%</span>
                </div>
                <div className="w-full h-4 bg-black/30 rounded-full p-0.5 shadow-inner">
                    <div 
                        className={`h-full rounded-full transition-all duration-300 relative overflow-hidden ${state.hp < 30 ? 'bg-red-400 animate-pulse' : 'bg-emerald-400'}`} 
                        style={{ width: `${Math.max(0, state.hp)}%` }} 
                    />
                </div>
             </div>
         </div>

         {/* --- Grid --- */}
         <div className="flex-1 overflow-y-auto relative no-scrollbar rounded-xl px-2">
             <div 
                className="grid gap-4 content-start pb-40"
                style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
             >
                {state.cards.map(card => {
                    if (card.isMatched) return <div key={card.id} className="invisible" />;
                    
                    const isMisted = state.mistedCardIds.includes(card.id);
                    let cardStyle = "";
                    let content = card.content;
                    
                    if (isMisted) {
                        cardStyle = "bg-gray-300 border-gray-500 text-transparent cursor-help opacity-80";
                    } else if (card.isSuccess) {
                        cardStyle = `bg-yellow-300 border-yellow-500 text-yellow-900 scale-110 z-20 shadow-xl rotate-2`;
                    } else if (card.isSelected) {
                        cardStyle = `${isBlue ? 'bg-blue-600 border-blue-800' : 'bg-pink-600 border-pink-800'} text-white scale-95 border-b-0 mt-[6px] shadow-inner brightness-110`;
                    } else if (card.isError) {
                        cardStyle = "bg-red-500 border-red-700 text-white animate-shake";
                    } else {
                        if (card.type === 'word') {
                             cardStyle = "bg-blue-100 border-blue-300 text-blue-900 shadow-[0_6px_0_rgb(147,197,253)] hover:-translate-y-1 hover:shadow-[0_8px_0_rgb(147,197,253)] active:translate-y-1 active:shadow-none active:border-b-0 active:mt-[6px]";
                        } else {
                             cardStyle = "bg-emerald-100 border-emerald-300 text-emerald-900 shadow-[0_6px_0_rgb(110,231,183)] hover:-translate-y-1 hover:shadow-[0_8px_0_rgb(110,231,183)] active:translate-y-1 active:shadow-none active:border-b-0 active:mt-[6px]";
                        }
                    }

                    return (
                        <button
                            key={card.id}
                            onClick={() => handleCardClick(state.id, card)}
                            className={`
                                w-full rounded-2xl flex items-center justify-center p-2
                                ${textSize} font-black transition-all duration-100
                                leading-tight break-words relative border-b-[6px]
                                ${cardStyle}
                            `}
                            style={{ minHeight: `${minH}px` }}
                        >
                            {content}
                            {isMisted && <div className="absolute inset-0 flex items-center justify-center"><CloudFog className="text-gray-500 w-12 h-12" /></div>}
                            {card.isSuccess && <Sparkles className="absolute -top-2 -right-2 text-white w-8 h-8 animate-spin" />}
                        </button>
                    );
                })}
            </div>

            {state.isFrozenBySkill && (
                <div className="absolute inset-0 bg-cyan-400/30 backdrop-blur-sm rounded-xl z-20 flex flex-col items-center justify-center animate-in fade-in border-4 border-cyan-300 shadow-[inset_0_0_50px_rgba(34,211,238,0.5)]">
                     <div className="bg-white p-8 rounded-full shadow-2xl animate-bounce">
                         <Lock size={64} className="text-cyan-500" />
                     </div>
                     <h3 className="text-5xl font-black text-white drop-shadow-md tracking-wider mt-8 stroke-text-cyan">已冻结!</h3>
                </div>
            )}
         </div>
         
         {/* --- Floating Zoom UI --- */}
         <div className="absolute bottom-6 left-6 z-30 pointer-events-none">
            <div className="bg-white/80 backdrop-blur-md p-2 rounded-2xl shadow-lg border border-gray-100 flex items-center gap-2 pointer-events-auto scale-90 origin-bottom-left hover:scale-100 transition-transform">
                 <button onClick={() => handleZoom(state.id, 'out')} className="p-2 hover:bg-gray-100 rounded-xl disabled:opacity-30 transition-colors" disabled={state.zoomLevel <= 1}>
                    <ZoomOut size={20} className="text-gray-600" />
                 </button>
                 <span className="font-black text-gray-700 w-8 text-center">{state.zoomLevel}x</span>
                 <button onClick={() => handleZoom(state.id, 'in')} className="p-2 hover:bg-gray-100 rounded-xl disabled:opacity-30 transition-colors" disabled={state.zoomLevel >= 5}>
                    <ZoomIn size={20} className="text-gray-600" />
                 </button>
            </div>
         </div>

         {/* --- Floating Skill UI --- */}
         <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 pointer-events-none transition-all w-full">
            <div className="flex items-center gap-2 pointer-events-auto animate-in slide-in-from-bottom-2">
                 {state.streak > 1 && (
                     <div className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full shadow-sm flex items-center gap-1 border-2 border-yellow-200 animate-bounce">
                         <Zap size={14} fill="currentColor" />
                         <span className="text-sm font-black">{state.streak} 连击</span>
                    </div>
                 )}
            </div>

            <div className="flex items-center gap-3 pointer-events-auto bg-white/70 p-2 rounded-2xl backdrop-blur-md border border-white/50 shadow-xl">
                <div className="flex flex-col items-center justify-center px-2 border-r border-gray-300/50">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">能量</span>
                    <span className={`text-xl font-black ${state.skillCharges >= 3 ? 'text-indigo-600' : 'text-gray-400'}`}>
                        {state.skillCharges}
                    </span>
                </div>
                <button 
                    onClick={() => handleCastSkill(state.id, 'freeze')}
                    disabled={state.skillCharges < 3 || state.freezeCooldown > 0 || state.isFrozen || state.isFrozenBySkill || !!gameResult}
                    className={`
                        relative w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-md group border-b-4 active:border-b-0 active:translate-y-1 active:mt-[4px]
                        ${(state.skillCharges >= 3 && state.freezeCooldown === 0) 
                            ? 'bg-cyan-400 border-cyan-600 hover:bg-cyan-300' 
                            : 'bg-gray-200 border-gray-300 cursor-not-allowed opacity-60'}
                    `}
                >
                    {state.freezeCooldown > 0 ? (
                        <span className="text-lg font-black text-white drop-shadow-md">{state.freezeCooldown}</span>
                    ) : (
                        <Snowflake size={24} className="text-white drop-shadow-sm group-hover:scale-110 transition-transform" />
                    )}
                    <span className="absolute -top-2 -right-2 bg-black/80 text-white text-[10px] px-1.5 rounded-full font-bold">-3</span>
                </button>
                <button 
                    onClick={() => handleCastSkill(state.id, 'mist')}
                    disabled={state.skillCharges < 3 || state.mistCooldown > 0 || state.isFrozen || state.isFrozenBySkill || !!gameResult}
                    className={`
                        relative w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-md group border-b-4 active:border-b-0 active:translate-y-1 active:mt-[4px]
                        ${(state.skillCharges >= 3 && state.mistCooldown === 0) 
                            ? 'bg-violet-400 border-violet-600 hover:bg-violet-300' 
                            : 'bg-gray-200 border-gray-300 cursor-not-allowed opacity-60'}
                    `}
                >
                    {state.mistCooldown > 0 ? (
                        <span className="text-lg font-black text-white drop-shadow-md">{state.mistCooldown}</span>
                    ) : (
                        <CloudFog size={24} className="text-white drop-shadow-sm group-hover:scale-110 transition-transform" />
                    )}
                    <span className="absolute -top-2 -right-2 bg-black/80 text-white text-[10px] px-1.5 rounded-full font-bold">-3</span>
                </button>
            </div>
         </div>

         {/* Winner Overlay */}
         {gameResult && gameResult.winner === state.id && (
             <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center z-40 animate-in zoom-in duration-300">
                 <div className="relative">
                    <div className="absolute inset-0 bg-yellow-400 blur-2xl opacity-40 animate-pulse"></div>
                    <Trophy size={100} className="text-yellow-400 mb-6 drop-shadow-lg relative z-10" fill="currentColor" />
                 </div>
                 <h2 className={`text-7xl font-black ${isBlue ? 'text-blue-600' : 'text-pink-600'} drop-shadow-sm tracking-tight`}>WINNER!</h2>
                 <p className="text-3xl font-bold mt-4 text-gray-500">{state.score} 分</p>
             </div>
         )}
         
         {/* Loser Overlay */}
         {gameResult && gameResult.winner !== state.id && gameResult.winner !== 'draw' && (
             <div className="absolute inset-0 bg-gray-900/80 flex flex-col items-center justify-center z-40 backdrop-blur-sm animate-in fade-in">
                 <XCircle size={80} className="text-white/50 mb-4" />
                 <h2 className="text-6xl font-black text-white tracking-widest">败北</h2>
                 <p className="text-2xl font-bold mt-4 text-gray-400">{state.score} 分</p>
             </div>
         )}

         {/* Draw Overlay */}
         {gameResult && gameResult.winner === 'draw' && (
             <div className="absolute inset-0 bg-indigo-900/80 flex flex-col items-center justify-center z-40 backdrop-blur-sm animate-in fade-in">
                 <div className="bg-white p-8 rounded-full mb-4">
                    <Swords size={60} className="text-indigo-600" />
                 </div>
                 <h2 className="text-6xl font-black text-white tracking-widest">平局</h2>
                 <p className="text-2xl font-bold mt-4 text-gray-400">{state.score} 分</p>
             </div>
         )}
      </div>
    );
  };

  const UserIcon = () => (
    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
  );

  const UserIcon2 = () => (
    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M18 21a8 8 0 0 0-16 0"/><circle cx="10" cy="8" r="5"/><path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3"/></svg>
  );

  if (gameStatus === 'setup') return renderSetupScreen();
  if (!p1State || !p2State) return <div className="min-h-screen flex items-center justify-center text-2xl font-black text-indigo-300">Loading Game...</div>;

  return (
    <div className="flex flex-col h-full bg-yellow-50 font-sans relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-[float_8s_infinite]"></div>
          <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-[float_10s_infinite_reverse]"></div>
      </div>

      {/* Top Bar with Timer */}
      <div className="flex justify-between items-center px-8 py-4 h-24 relative z-20">
         <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border-b-4 border-gray-100 flex items-center gap-2">
            <span className="text-gray-400 font-bold uppercase text-xs">Total Words</span>
            <span className="text-2xl font-black text-gray-800">{words.length}</span>
         </div>

         {/* Main Timer Display */}
         <div className={`
            absolute left-1/2 -translate-x-1/2 top-4
            bg-white px-8 py-2 rounded-2xl shadow-lg border-b-8 border-gray-200
            flex items-center gap-4 transition-transform
            ${timeLeft <= 10 ? 'scale-110 border-red-200 animate-pulse' : ''}
         `}>
             <Clock size={32} className={timeLeft <= 10 ? 'text-red-500' : 'text-indigo-500'} />
             <span className={`text-5xl font-black tabular-nums ${timeLeft <= 10 ? 'text-red-500' : 'text-gray-800'}`}>
                 {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
             </span>
         </div>
         
         <button onClick={onExit} className="p-4 bg-white rounded-2xl shadow-sm hover:bg-red-50 hover:text-red-500 border-b-4 border-gray-100 active:border-b-0 active:translate-y-1 transition-all text-gray-400">
            <Home size={32} />
         </button>
      </div>

      {/* Main Battle Area */}
      <div className="flex-1 flex gap-2 md:gap-8 px-4 pb-6 max-w-[1920px] mx-auto w-full overflow-hidden relative z-10">
         {renderBoard(p1State, 'blue')}
         
         {/* VS Divider - Animated */}
         <div className="hidden md:flex flex-col items-center justify-center relative flex-shrink-0 w-16">
            <div className="absolute h-full w-2 bg-gradient-to-b from-blue-200 via-purple-200 to-pink-200 rounded-full opacity-50"></div>
            <div className="bg-white border-[6px] border-yellow-400 rounded-full p-6 shadow-[0_0_30px_rgba(250,204,21,0.4)] z-20 animate-[bounce_2s_infinite]">
                <Swords size={40} className="text-indigo-900" />
            </div>
            <div className="absolute bg-yellow-400 text-yellow-900 font-black text-xl px-2 py-1 rounded-md -rotate-12 mt-20 z-30 shadow-md border-2 border-white">
                VS
            </div>
         </div>
         
         {renderBoard(p2State, 'pink')}
      </div>

      {/* Game Over Controls */}
      {gameResult && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center pb-20 pointer-events-none">
              <div className="bg-white rounded-[2rem] shadow-2xl p-6 flex gap-6 pointer-events-auto animate-in slide-in-from-bottom-20 border-8 border-indigo-100">
                  <Button onClick={() => setGameStatus('setup')} size="lg" className="shadow-xl">
                      <RefreshCw size={28} className="mr-2" /> 再战一局
                  </Button>
                  <Button onClick={onExit} variant="secondary" size="lg" className="shadow-xl">
                      退出游戏
                  </Button>
              </div>
          </div>
      )}
      
      <style>{`
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px) rotate(-2deg); }
            75% { transform: translateX(5px) rotate(2deg); }
        }
        .animate-shake {
            animation: shake 0.3s cubic-bezier(.36,.07,.19,.97) both;
        }
        @keyframes float {
            0%, 100% { transform: translate(0, 0); }
            50% { transform: translate(20px, 20px); }
        }
        .stroke-text-cyan {
            -webkit-text-stroke: 2px #06b6d4;
        }
      `}</style>
    </div>
  );
};
