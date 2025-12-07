
import React, { useState } from 'react';
import { WordPair, VocabList } from '../types';
import { Trash2, Plus, Save, ArrowLeft, RotateCcw, Folder, Edit2, Check, X, ChevronRight, Book } from 'lucide-react';
import { Button } from './Button';

interface WordEditorProps {
  lists: VocabList[];
  onSaveLists: (lists: VocabList[]) => void;
  onBack: () => void;
}

export const WordEditor: React.FC<WordEditorProps> = ({ lists: initialLists, onSaveLists, onBack }) => {
  // Global State
  const [lists, setLists] = useState<VocabList[]>(initialLists);
  
  // View State
  const [editingListId, setEditingListId] = useState<string | null>(null);

  // --- List Management Logic ---
  const [newListName, setNewListName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const handleCreateList = () => {
    if (!newListName.trim()) return;
    const newList: VocabList = {
        id: crypto.randomUUID(),
        name: newListName.trim(),
        words: [],
        createdAt: Date.now()
    };
    setLists([newList, ...lists]);
    setNewListName('');
  };

  const handleDeleteList = (id: string) => {
    if (window.confirm("确定要删除这个词单吗？")) {
        setLists(lists.filter(l => l.id !== id));
    }
  };

  const startRename = (list: VocabList) => {
      setRenamingId(list.id);
      setRenameValue(list.name);
  };

  const confirmRename = () => {
      if (renamingId && renameValue.trim()) {
          setLists(lists.map(l => l.id === renamingId ? { ...l, name: renameValue.trim() } : l));
          setRenamingId(null);
      }
  };

  // --- Word Editing Logic (Inner) ---
  const activeList = lists.find(l => l.id === editingListId);
  const [newWord, setNewWord] = useState('');
  const [newMeaning, setNewMeaning] = useState('');

  const handleWordUpdate = (updatedWords: WordPair[]) => {
      if (!editingListId) return;
      setLists(lists.map(l => l.id === editingListId ? { ...l, words: updatedWords } : l));
  };

  const handleAddWord = () => {
    if (newWord.trim() && newMeaning.trim() && activeList) {
      const pair: WordPair = { id: crypto.randomUUID(), word: newWord.trim(), meaning: newMeaning.trim() };
      handleWordUpdate([pair, ...activeList.words]);
      setNewWord('');
      setNewMeaning('');
    }
  };

  const handleDeleteWord = (wordId: string) => {
      if (activeList) {
          handleWordUpdate(activeList.words.filter(w => w.id !== wordId));
      }
  };

  const handleWordFieldChange = (wordId: string, field: 'word' | 'meaning', value: string) => {
      if (activeList) {
          handleWordUpdate(activeList.words.map(w => w.id === wordId ? { ...w, [field]: value } : w));
      }
  };

  const handleClearWords = () => {
      if (window.confirm("确定清空当前词单的所有单词吗？")) {
          handleWordUpdate([]);
      }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAddWord();
  }

  // --- Render: List Overview Mode ---
  if (!editingListId) {
      return (
        <div className="flex flex-col h-screen bg-yellow-50 font-sans">
            {/* Header */}
            <div className="bg-white border-b-4 border-gray-100 px-8 py-4 flex justify-between items-center h-24 sticky top-0 z-20">
                <Button onClick={() => { onSaveLists(lists); onBack(); }} variant="secondary" size="md" className="rounded-full px-4">
                    <ArrowLeft size={28} />
                </Button>
                <h2 className="text-4xl font-black text-gray-800 tracking-tight">我的词单小本子</h2>
                <div className="w-12"></div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto w-full">
                {/* Create New List Card */}
                <div className="bg-white p-6 rounded-[2rem] shadow-sm mb-8 flex gap-4 items-center border-4 border-indigo-100 dashed">
                    <div className="bg-indigo-100 p-4 rounded-2xl">
                        <Folder size={32} className="text-indigo-500" />
                    </div>
                    <input 
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        placeholder="新建词单名称 (例如: 第一单元)"
                        className="flex-1 text-2xl font-bold bg-transparent border-b-4 border-gray-100 focus:border-indigo-400 outline-none px-2 py-2 placeholder-gray-300 transition-colors"
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
                    />
                    <Button onClick={handleCreateList} disabled={!newListName.trim()} variant="primary">
                        新建
                    </Button>
                </div>

                {/* List of Lists */}
                <div className="grid gap-6">
                    {lists.map((list, index) => {
                        // Random rotation for "sticker" effect
                        const rotate = index % 2 === 0 ? 'rotate-1' : '-rotate-1';
                        
                        return (
                            <div key={list.id} className={`group bg-white p-6 rounded-[2rem] shadow-sm border-b-8 border-gray-200 hover:border-indigo-300 hover:-translate-y-1 transition-all flex items-center gap-6 ${rotate}`}>
                                {/* Icon */}
                                <div className="bg-amber-100 p-5 rounded-2xl border-2 border-amber-200">
                                    <Book size={32} className="text-amber-600" />
                                </div>

                                {/* Name Area */}
                                <div className="flex-1">
                                    {renamingId === list.id ? (
                                        <div className="flex items-center gap-2">
                                            <input 
                                                value={renameValue}
                                                onChange={(e) => setRenameValue(e.target.value)}
                                                className="text-3xl font-bold border-b-4 border-indigo-500 outline-none w-full"
                                                autoFocus
                                            />
                                            <button onClick={confirmRename} className="p-2 bg-green-100 text-green-600 rounded-xl"><Check /></button>
                                            <button onClick={() => setRenamingId(null)} className="p-2 bg-red-100 text-red-600 rounded-xl"><X /></button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-4">
                                            <h3 className="text-3xl font-black text-gray-800">{list.name}</h3>
                                            <button onClick={() => startRename(list)} className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-blue-500 transition-opacity">
                                                <Edit2 size={24} />
                                            </button>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-lg font-bold text-sm">
                                            {list.words.length} 单词
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <Button onClick={() => setEditingListId(list.id)} variant="secondary" className="!rounded-xl">
                                    去编辑 <ChevronRight />
                                </Button>
                                
                                <button 
                                    onClick={() => handleDeleteList(list.id)}
                                    className="p-4 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                >
                                    <Trash2 size={28} />
                                </button>
                            </div>
                        )
                    })}

                    {lists.length === 0 && (
                        <div className="text-center py-20 text-gray-400">
                            <p className="text-2xl font-bold">空空如也 ~</p>
                            <p className="text-lg mt-2">快创建一个新的词单吧！</p>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="p-6 bg-white border-t-4 border-gray-100 z-20">
                <div className="max-w-5xl mx-auto">
                    <Button onClick={() => { onSaveLists(lists); onBack(); }} fullWidth variant="success" size="lg">
                        <Save size={28} className="mr-2" /> 保存并返回
                    </Button>
                </div>
            </div>
        </div>
      );
  }

  // --- Render: Word Editing Mode (Inner) ---
  if (!activeList) return null;

  return (
    <div className="flex flex-col h-screen bg-indigo-50 font-sans">
      {/* Header */}
      <div className="bg-white border-b-4 border-gray-100 px-6 py-4 flex justify-between items-center h-24 shadow-sm z-20">
        <Button onClick={() => setEditingListId(null)} variant="secondary" className="rounded-full !px-4">
            <ArrowLeft size={28} />
        </Button>
        <div className="text-center">
            <h2 className="text-3xl font-black text-gray-800">{activeList.name}</h2>
            <p className="text-gray-400 font-bold">{activeList.words.length} 个单词</p>
        </div>
        <button 
            onClick={handleClearWords} 
            className="p-3 bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 rounded-xl transition-colors font-bold"
            title="清空"
        >
            <RotateCcw size={28} />
        </button>
      </div>

      <div className="flex-1 flex flex-col max-w-5xl w-full mx-auto overflow-hidden py-6">
        
        {/* Input Area */}
        <div className="bg-white p-8 mx-6 rounded-[2.5rem] shadow-xl border-b-8 border-indigo-200 flex-shrink-0 relative mb-6">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-500 text-white px-6 py-1 rounded-full font-bold text-sm tracking-widest shadow-md">
                添加新词
            </div>
            <div className="flex flex-col sm:flex-row gap-4 mt-2">
                <div className="flex-1 relative">
                    <input
                        value={newWord}
                        onChange={(e) => setNewWord(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="英文单词 (Apple)"
                        className="w-full bg-indigo-50 border-2 border-indigo-100 rounded-2xl px-6 py-4 text-2xl font-bold focus:border-indigo-400 focus:bg-white outline-none transition-all placeholder-indigo-200"
                        autoFocus
                    />
                </div>
                <div className="flex-1 relative">
                    <input
                        value={newMeaning}
                        onChange={(e) => setNewMeaning(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="中文释义 (苹果)"
                        className="w-full bg-emerald-50 border-2 border-emerald-100 rounded-2xl px-6 py-4 text-2xl font-bold focus:border-emerald-400 focus:bg-white outline-none transition-all placeholder-emerald-200 text-right"
                    />
                </div>
                <Button 
                    onClick={handleAddWord}
                    disabled={!newWord.trim() || !newMeaning.trim()}
                    variant="primary"
                    className="!rounded-2xl !px-6"
                >
                    <Plus size={36} />
                </Button>
            </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-6 pb-20 space-y-4 no-scrollbar">
            {activeList.words.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-indigo-300/50 p-8 text-center">
                    <Book size={80} className="mb-4 opacity-50" />
                    <p className="text-3xl font-black">列表为空</p>
                    <p className="text-xl mt-2 font-bold">在上方添加你的第一个单词！</p>
                </div>
            ) : (
                activeList.words.map((item, idx) => (
                <div key={item.id} className="bg-white p-4 rounded-[1.5rem] shadow-sm flex items-center gap-4 border-2 border-transparent hover:border-indigo-200 transition-colors group">
                    <div className="bg-gray-100 w-10 h-10 rounded-full flex items-center justify-center text-gray-400 font-bold">
                        {activeList.words.length - idx}
                    </div>
                    
                    <input
                        value={item.word}
                        onChange={(e) => handleWordFieldChange(item.id, 'word', e.target.value)}
                        className="flex-1 font-bold text-3xl text-indigo-900 bg-transparent border-b-2 border-transparent focus:border-indigo-500 focus:outline-none px-2 py-2"
                    />
                    
                    <div className="text-gray-300 mx-2">
                        <ArrowLeft size={20} className="rotate-180" />
                    </div>

                    <input
                        value={item.meaning}
                        onChange={(e) => handleWordFieldChange(item.id, 'meaning', e.target.value)}
                        className="flex-1 text-3xl font-bold text-emerald-700 bg-transparent border-b-2 border-transparent focus:border-emerald-500 focus:outline-none px-2 py-2 text-right"
                    />
                    
                    <button 
                        onClick={() => handleDeleteWord(item.id)}
                        className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-3 rounded-xl transition-colors ml-2"
                    >
                        <Trash2 size={24} />
                    </button>
                </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
};
