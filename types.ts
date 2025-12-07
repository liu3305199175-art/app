
export interface WordPair {
  id: string;
  word: string; // English
  meaning: string; // Chinese
}

export interface VocabList {
  id: string;
  name: string;
  words: WordPair[];
  createdAt: number;
}

export type AppView = 'welcome' | 'upload' | 'editor' | 'game-menu' | 'game-match' | 'game-match-pk' | 'game-bomb';

export interface GameStats {
  score: number;
  streak: number;
  bestScore: number;
}
