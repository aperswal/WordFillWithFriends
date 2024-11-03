export interface User {
  uid: string;
  email: string;
  username?: string;
  iconId?: number;
  iconColor?: string;
  backgroundId?: number;
  score: number;
  rank?: number;
  tier?: TierType;
  gamesPlayed: number;
  winRate: number;
  wins?: number;
  lastGameAt?: number;
}


export interface Game {
  id: string;
  word: string;
  guesses: string[];
  status: 'playing' | 'won' | 'lost';
  createdAt: number;
  userId?: string;
  sharedBy?: string;
  sharedWith?: string[];
}

export interface GameSeries {
  id: string;
  player1: string;
  player2: string;
  player1Score: number;
  player2Score: number;
  games: string[];
  players: string[];
}

export interface GlobalRanking {
  userId: string;
  username: string;
  score: number;
  rank: number;
  tier: TierType;
  iconId: number;
  iconColor: string;
  backgroundId: number;
}