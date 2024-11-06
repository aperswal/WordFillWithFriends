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

export interface SeriesGame {
  id: string;
  word: string;
  player1Score: number;
  player2Score: number;
  winner: string | null;
  completedAt: number;
}
interface GameStats {
  invalidWordAttempts: number;
  reusedAbsentLetters: number;
  reusedWrongPositions: number;
  timeToComplete: number;
  turnsUsed: number;
}
export interface Game {
  id: string;
  word: string;
  guesses: string[];
  status: 'playing' | 'won' | 'lost';
  createdAt: number;
  seriesId?: string;
  userId?: string;
  sharedBy?: string;
  sharedWith?: string[];
  playerScore?: number;
  stats?: GameStats;
  completedAt?: number;
}

export interface GameSeries {
  id: string;
  players: string[];
  playerNames: Record<string, string>;
  currentGameId: string;
  player1: string;
  player2: string;
  player1Score: number;
  player2Score: number;
  games: Game[];
  lastPlayedAt: number;
  status: 'active' | 'completed';
  currentWord?: string;  // Add this to track the current word
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