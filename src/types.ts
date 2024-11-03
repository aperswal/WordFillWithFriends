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

export interface SeriesGame {
  id: string;
  word: string;
  player1Score: number;
  player2Score: number;
  winner: string | null;
  completedAt: number;
}

export interface GameSeries {
  id: string;
  players: string[];
  playerNames: Record<string, string>;
  player1: string;
  player2: string;
  player1Score: number;
  player2Score: number;
  games: SeriesGame[];
  lastPlayedAt: number;
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