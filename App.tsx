
import React, { useState, useEffect } from 'react';
import { AppView, WordPair, VocabList } from './types';
import { WordEditor } from './components/WordEditor';
import { WordMatchGame } from './components/games/WordMatchGame';
import { WordMatchPKGame } from './components/games/WordMatchPKGame';
import { WordBombGame } from './components/games/WordBombGame';
import { Button } from './components/Button';
import { BookOpen, Gamepad2, AlertCircle, Edit3, Play, List, Users, User, X, ChevronDown, Check, Star, Sparkles, Music } from 'lucide-react';

const DEMO_DATA: WordPair[] = [
  { id: '1', word: 'Ambiguous', meaning: '模棱两可的' },
  { id: '2', word: 'Benevolent', meaning: '仁慈的' },
  { id: '3', word: 'Candid', meaning: '坦率的' },
  { id: '4', word: 'Diligent', meaning: '勤奋的' },
  { id: '5', word: 'Empathy', meaning: '同理心' },
  { id: '6', word: 'Flourish', meaning: '繁荣' },
  { id: '7', word: 'Gratitude', meaning: '感激' },
  { id: '8', word: 'Harmony', meaning: '和谐' },
];

const STORAGE_KEY = 'linguasnap-vocabulary'; 
const LISTS_STORAGE_KEY = 'linguasnap-vocab-lists'; 

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('welcome');
  const [showMatchModeModal, setShowMatchModeModal] = useState(false);
  const [showListSelector, setShowListSelector] = useState(false);
  
  const [vocabLists, setVocabLists] = useState<VocabList[]>([]);
  const [activeListId, setActiveListId] = useState<string | null>(null);

  // --- Initialization (Same as before) ---
  useEffect(() => {
    try {
      const savedListsRaw = localStorage.getItem(LISTS_STORAGE_KEY);
      if (savedListsRaw) {
        const parsedLists: VocabList[] = JSON.parse(savedListsRaw);
        setVocabLists(parsedLists);
        if (parsedLists.length > 0) setActiveListId(parsedLists[0].id);
      } else {
        const legacyRaw = localStorage.getItem(STORAGE_KEY);
        if (legacyRaw) {
           const legacyWords: WordPair[] = JSON.parse(legacyRaw);
           if (legacyWords.length > 0) {
               const newList: VocabList = {
                   id: crypto.randomUUID(),
                   name: '默认词单',
                   words: legacyWords,
                   createdAt: Date.now()
               };
               setVocabLists([newList]);
               setActiveListId(newList.id);
               localStorage.setItem(LISTS_STORAGE_KEY, JSON.stringify([newList]));
           }
        }
      }
    } catch (e) {
      console.error("Failed to load vocabulary", e);
    }
  }, []);

  useEffect(() => {
    if (vocabLists.length > 0) {
        localStorage.setItem(LISTS_STORAGE_KEY, JSON.stringify(vocabLists));
    }
  }, [vocabLists]);

  const handleSaveLists = (newLists: VocabList[]) => {
    setVocabLists(newLists);
    if (newLists.length > 0) {
        if (!activeListId || !newLists.find(l => l.id === activeListId)) {
            setActiveListId(newLists[0].id);
        }
    } else {
        setActiveListId(null);
    }
  };

  const handleLoadDemo = () => {
    const demoList: VocabList = {
        id: crypto.randomUUID(),
        name: '演示词汇 (Demo)',
        words: DEMO_DATA,
        createdAt: Date.now()
    };
    const newLists = [...vocabLists, demoList];
    setVocabLists(newLists);
    setActiveListId(demoList.id);
    setView('game-menu');
  };

  const handleClearAllData = () => {
    if (window.confirm("确定要清空所有数据吗？这将无法恢复。")) {
      setVocabLists([]);
      setActiveListId(null);
      localStorage.removeItem(LISTS_STORAGE_KEY);
      localStorage.removeItem(STORAGE_KEY);
      setView('welcome');
    }
  };

  const getCurrentWords = (): WordPair[] => {
      const list = vocabLists.find(l => l.id === activeListId);
      return list ? list.words : [];
  };
  
  const currentList = vocabLists.find(l => l.id === activeListId);

  // --- BACKGROUND ANIMATION COMPONENT ---
  const AnimatedBackground = () => (
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-yellow-50">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-100 via-orange-50 to-rose-50 opacity-70"></div>
          {/* Floating Blobs */}
          <div className="absolute top-10 left-10 w-32 h-32 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-[float_6s_ease-in-out_infinite]"></div>
          <div className="absolute top-40 right-20 w-48 h-48 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-[float_8s_ease-in-out_infinite_1s]"></div>
          <div className="absolute -bottom-20 left-1/3 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-[float_10s_ease-in-out_infinite_2s]"></div>
          <div className="absolute bottom-40 right-10 w-40 h-40 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-[float_7s_ease-in-out_infinite_0.5s]"></div>
          
          <style>{`
            @keyframes float {
                0% { transform: translateY(0px) rotate(0deg); }
                50% { transform: translateY(-20px) rotate(5deg); }
                100% { transform: translateY(0px) rotate(0deg); }
            }
          `}</style>
      </div>
  );

  // --- Renders ---

  const renderWelcome = () => (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative font-sans overflow-hidden">
      <AnimatedBackground />
      
      <div className="w-full max-w-4xl text-center space-y-12 relative z-10">
        
        {/* Logo / Title Area */}
        <div className="transform hover:scale-105 transition-transform duration-500">
            <div className="inline-block relative">
                 <h1 className="text-8xl md:text-9xl font-black tracking-tight text-white drop-shadow-[0_8px_0_rgba(0,0,0,0.2)]"
                     style={{ WebkitTextStroke: '3px #4F46E5', textShadow: '4px 4px 0 #4F46E5' }}>
                    <span className="text-yellow-400">徐</span>
                    <span className="text-pink-400">老师</span>
                    <span className="text-blue-400">的</span>
                    <br/>
                    <span className="text-indigo-500 text-7xl md:text-8xl">小助手</span>
                 </h1>
                 <Sparkles className="absolute -top-12 -right-12 text-yellow-400 w-24 h-24 animate-pulse" fill="currentColor" />
                 <Star className="absolute -bottom-4 -left-8 text-pink-400 w-16 h-16 animate-spin-slow" fill="currentColor" />
            </div>
            <p className="mt-6 text-indigo-900/60 text-2xl font-bold tracking-wider uppercase bg-white/50 inline-block px-6 py-2 rounded-full backdrop-blur-sm">
                快乐学习 · 轻松记忆
            </p>
        </div>

        {/* Main Action Card */}
        <div className="bg-white/60 backdrop-blur-xl rounded-[3rem] p-12 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-4 border-white space-y-8 animate-[slideUp_0.8s_ease-out]">
            
            {vocabLists.length > 0 ? (
                <>
                    {/* Current List Ticket */}
                    <div className="bg-white rounded-3xl p-6 border-b-8 border-r-8 border-indigo-100 transform rotate-1 hover:rotate-0 transition-transform">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 text-left">
                                <div className="bg-yellow-100 p-4 rounded-2xl">
                                    <BookOpen size={32} className="text-yellow-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-400 uppercase">准备就绪</p>
                                    <h3 className="text-3xl font-black text-gray-800 truncate max-w-xs md:max-w-md">{currentList?.name}</h3>
                                </div>
                            </div>
                            <div className="bg-indigo-50 px-5 py-2 rounded-xl text-indigo-600 font-black text-2xl">
                                {currentList?.words.length} <span className="text-sm font-bold">词</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Button 
                            onClick={() => setView('game-menu')} 
                            variant="success"
                            size="xl"
                            fullWidth 
                            className="shadow-lg shadow-emerald-200"
                        >
                            <Play size={40} className="mr-3 fill-current" /> 开始游戏
                        </Button>
                        <Button 
                            onClick={() => setView('editor')} 
                            variant="secondary"
                            size="xl"
                            fullWidth 
                            className="shadow-lg"
                        >
                            <Edit3 size={36} className="mr-3" /> 编辑词单
                        </Button>
                    </div>
                </>
            ) : (
                 <div className="py-8">
                     <p className="text-3xl font-bold text-indigo-900 mb-8">还没有单词卡片哦！</p>
                     <Button 
                        onClick={() => setView('editor')} 
                        variant="primary"
                        size="xl"
                        fullWidth 
                        className="animate-bounce"
                     >
                       <List size={40} className="mr-4" /> 创建第一个词单
                     </Button>
                 </div>
            )}
             
             {/* Footer Links */}
             <div className="pt-6 flex justify-center gap-6 opacity-80">
                <button onClick={handleLoadDemo} className="text-indigo-600 font-bold hover:underline hover:text-indigo-800 flex items-center gap-2">
                    <Sparkles size={18} /> 加载演示数据
                </button>
                {vocabLists.length > 0 && (
                    <button onClick={handleClearAllData} className="text-red-400 font-bold hover:underline hover:text-red-600 flex items-center gap-2">
                        <X size={18} /> 重置所有数据
                    </button>
                )}
             </div>
          </div>
      </div>
    </div>
  );

  const renderGameMenu = () => {
      const currentWords = getCurrentWords();
      const hasEnoughWords = currentWords.length >= 4;

      return (
    <div className="min-h-screen flex flex-col p-6 relative font-sans">
       <AnimatedBackground />

       {/* Mode Selection Modal (Popup) */}
       {showMatchModeModal && (
         <div className="fixed inset-0 z-50 bg-indigo-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[3rem] p-10 max-w-5xl w-full shadow-2xl border-8 border-indigo-200 relative">
               <button onClick={() => setShowMatchModeModal(false)} className="absolute top-6 right-6 p-3 bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-500 rounded-full transition-colors">
                 <X size={32} />
               </button>

               <div className="text-center mb-10">
                  <h3 className="text-5xl font-black text-indigo-900">选择消消乐模式</h3>
                  <p className="text-xl text-gray-500 mt-2 font-bold">准备好开始挑战了吗？</p>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Solo Mode Card */}
                  <button 
                    onClick={() => { setShowMatchModeModal(false); setView('game-match'); }}
                    className="group relative flex flex-col items-center justify-center p-10 bg-blue-50 border-b-8 border-blue-200 active:border-b-0 active:translate-y-2 rounded-[2.5rem] transition-all hover:bg-blue-100"
                  >
                     <div className="bg-blue-400 p-6 rounded-full shadow-lg mb-6 group-hover:scale-110 transition-transform rotate-3 group-hover:rotate-6">
                        <User size={64} className="text-white" />
                     </div>
                     <span className="text-4xl font-black text-blue-900">单人练习</span>
                     <span className="text-lg font-bold text-blue-400 mt-2">自我挑战 · 计时模式</span>
                  </button>

                  {/* PK Mode Card */}
                  <button 
                    onClick={() => { setShowMatchModeModal(false); setView('game-match-pk'); }}
                    className="group relative flex flex-col items-center justify-center p-10 bg-pink-50 border-b-8 border-pink-200 active:border-b-0 active:translate-y-2 rounded-[2.5rem] transition-all hover:bg-pink-100"
                  >
                     <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider animate-pulse">
                        推荐
                     </div>
                     <div className="bg-pink-400 p-6 rounded-full shadow-lg mb-6 group-hover:scale-110 transition-transform -rotate-3 group-hover:-rotate-6">
                        <Users size={64} className="text-white" />
                     </div>
                     <span className="text-4xl font-black text-pink-900">双人对战</span>
                     <span className="text-lg font-bold text-pink-400 mt-2">同屏PK · 技能互攻</span>
                  </button>
               </div>
            </div>
         </div>
       )}

       {/* List Selector Modal */}
       {showListSelector && (
           <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-center justify-center p-8" onClick={() => setShowListSelector(false)}>
               <div className="bg-white rounded-[2.5rem] p-8 max-w-2xl w-full shadow-2xl max-h-[80vh] overflow-y-auto animate-[popIn_0.3s_ease-out]" onClick={e => e.stopPropagation()}>
                   <div className="flex justify-between items-center mb-6 px-2">
                       <h3 className="text-3xl font-black text-gray-800">切换当前词单</h3>
                       <button onClick={() => setShowListSelector(false)} className="p-2 bg-gray-100 rounded-full"><X /></button>
                   </div>
                   <div className="space-y-4">
                       {vocabLists.map(list => (
                           <button 
                                key={list.id}
                                onClick={() => { setActiveListId(list.id); setShowListSelector(false); }}
                                className={`w-full text-left p-5 rounded-2xl flex items-center justify-between transition-all border-b-4 active:border-b-0 active:translate-y-1 
                                    ${activeListId === list.id 
                                        ? 'bg-indigo-500 border-indigo-700 text-white shadow-indigo-200' 
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                           >
                               <div>
                                   <span className="text-xl font-bold block">{list.name}</span>
                                   <span className={`text-sm font-medium ${activeListId === list.id ? 'text-indigo-200' : 'text-gray-400'}`}>{list.words.length} 个单词</span>
                               </div>
                               {activeListId === list.id && <div className="bg-white text-indigo-500 p-2 rounded-full"><Check size={20} strokeWidth={4} /></div>}
                           </button>
                       ))}
                   </div>
               </div>
           </div>
       )}

       {/* MAIN MENU CONTENT */}
       <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col justify-center relative z-10">
          
          {/* Header Area */}
          <div className="flex flex-col items-center mb-10">
            <h2 className="text-6xl font-black text-white drop-shadow-md mb-8 tracking-wide" style={{ WebkitTextStroke: '2px #4F46E5' }}>选择游戏</h2>
            
            {/* List Dropdown Pill */}
            <div className="relative z-20">
                <button 
                    onClick={() => setShowListSelector(true)}
                    className="bg-white pl-8 pr-2 py-2 rounded-full shadow-[0_10px_20px_rgba(79,70,229,0.2)] flex items-center gap-4 hover:scale-105 transition-transform"
                >
                    <div className="text-left">
                        <p className="text-indigo-300 text-xs font-bold uppercase tracking-wider">正在学习</p>
                        <p className="text-2xl font-black text-indigo-900 max-w-[200px] md:max-w-[300px] truncate">{currentList?.name}</p>
                    </div>
                    <div className="bg-indigo-100 h-12 w-12 rounded-full flex items-center justify-center text-indigo-600">
                        <ChevronDown size={28} strokeWidth={3} />
                    </div>
                </button>
            </div>
            
            {!hasEnoughWords && (
                <div className="mt-6 flex items-center gap-3 bg-red-500 text-white px-6 py-3 rounded-2xl shadow-lg animate-bounce">
                    <AlertCircle strokeWidth={3} />
                    <span className="font-bold text-lg">单词不够啦！请先添加至少4个单词。</span>
                </div>
            )}
          </div>

          {/* Game Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            
            {/* MATCH GAME CARD */}
            <div 
                onClick={() => hasEnoughWords && setShowMatchModeModal(true)}
                className={`
                    relative h-[24rem] rounded-[3rem] p-8 flex flex-col justify-between overflow-hidden transition-all duration-300 border-b-[12px] active:border-b-0 active:translate-y-3
                    ${hasEnoughWords 
                        ? 'bg-gradient-to-br from-blue-400 to-indigo-500 border-indigo-700 cursor-pointer hover:shadow-2xl shadow-blue-300/50 hover:-translate-y-1' 
                        : 'bg-gray-200 border-gray-400 cursor-not-allowed grayscale opacity-70'
                    }
                `}
            >
                {/* Decorative BG */}
                <div className="absolute -right-10 -top-10 text-white/10 rotate-12">
                    <Gamepad2 size={260} />
                </div>
                
                {/* Icon */}
                <div className="relative z-10 bg-white/20 backdrop-blur-md w-24 h-24 rounded-3xl flex items-center justify-center text-white border-2 border-white/30 shadow-inner">
                    <BookOpen size={48} fill="currentColor" className="text-white" />
                </div>

                {/* Text */}
                <div className="relative z-10 text-white">
                    <h3 className="text-5xl font-black mb-2 drop-shadow-sm">单词消消乐</h3>
                    <p className="text-blue-100 text-xl font-medium leading-relaxed">
                        眼疾手快，连连看！<br/>
                        <span className="bg-white/20 px-2 py-1 rounded-lg text-sm mt-2 inline-block">包含 PK 对战模式</span>
                    </p>
                </div>
                
                {/* Play Button visual */}
                {hasEnoughWords && (
                    <div className="absolute bottom-8 right-8 bg-white text-indigo-600 p-4 rounded-full shadow-lg">
                        <Play size={32} fill="currentColor" />
                    </div>
                )}
            </div>

            {/* BOMB GAME CARD */}
            <div 
                onClick={() => hasEnoughWords && setView('game-bomb')}
                className={`
                    relative h-[24rem] rounded-[3rem] p-8 flex flex-col justify-between overflow-hidden transition-all duration-300 border-b-[12px] active:border-b-0 active:translate-y-3
                    ${hasEnoughWords 
                        ? 'bg-gradient-to-br from-orange-400 to-red-500 border-red-700 cursor-pointer hover:shadow-2xl shadow-orange-300/50 hover:-translate-y-1' 
                        : 'bg-gray-200 border-gray-400 cursor-not-allowed grayscale opacity-70'
                    }
                `}
            >
                 {/* Decorative BG */}
                 <div className="absolute -right-10 -top-10 text-white/10 -rotate-12">
                    <AlertCircle size={260} />
                </div>

                {/* Icon */}
                <div className="relative z-10 bg-white/20 backdrop-blur-md w-24 h-24 rounded-3xl flex items-center justify-center text-white border-2 border-white/30 shadow-inner">
                    <AlertCircle size={48} fill="currentColor" className="text-white" />
                </div>

                {/* Text */}
                <div className="relative z-10 text-white">
                    <h3 className="text-5xl font-black mb-2 drop-shadow-sm">单词炸弹</h3>
                    <p className="text-orange-100 text-xl font-medium leading-relaxed">
                        争分夺秒，拆炸弹！<br/>
                        <span className="bg-white/20 px-2 py-1 rounded-lg text-sm mt-2 inline-block">30秒极速挑战</span>
                    </p>
                </div>

                 {/* Play Button visual */}
                 {hasEnoughWords && (
                    <div className="absolute bottom-8 right-8 bg-white text-red-600 p-4 rounded-full shadow-lg">
                        <Play size={32} fill="currentColor" />
                    </div>
                )}
            </div>
          </div>

          <div className="flex gap-6 justify-center">
            <Button onClick={() => setView('editor')} variant="secondary" size="lg" className="shadow-sm">
                <Edit3 size={24} className="mr-2" /> 管理词单
            </Button>
            <Button onClick={() => setView('welcome')} variant="secondary" size="lg" className="shadow-sm">
                <User size={24} className="mr-2" /> 返回首页
            </Button>
          </div>
       </div>
    </div>
  )};

  return (
    <div className="min-h-screen font-sans bg-yellow-50 text-gray-900 overflow-x-hidden selection:bg-pink-200">
      {view === 'welcome' && renderWelcome()}
      {view === 'editor' && (
        <WordEditor 
            lists={vocabLists}
            onSaveLists={handleSaveLists}
            onBack={() => setView(vocabLists.length > 0 ? 'game-menu' : 'welcome')}
        />
      )}
      {view === 'game-menu' && renderGameMenu()}
      {view === 'game-match' && <WordMatchGame words={getCurrentWords()} onExit={() => setView('game-menu')} />}
      {view === 'game-match-pk' && <WordMatchPKGame words={getCurrentWords()} onExit={() => setView('game-menu')} />}
      {view === 'game-bomb' && <WordBombGame words={getCurrentWords()} onExit={() => setView('game-menu')} />}
      
      {/* Global Animation Keyframes */}
      <style>{`
        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        @keyframes popIn {
            0% { transform: scale(0.9); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
        }
        @keyframes slideUp {
            0% { transform: translateY(50px); opacity: 0; }
            100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default App;
