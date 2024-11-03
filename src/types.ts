export interface Game {
  id: string;
  word: string;
  guesses: string[];
  status: 'playing' | 'won' | 'lost';
  createdAt: number;
  sharedWith?: string[];
  sharedBy?: string;
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
}

export interface GameSeries {
  id: string;
  player1: string;
  player2: string;
  games: string[];
  player1Score: number;
  player2Score: number;
  lastPlayedAt: number;
}