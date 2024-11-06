const SCORING_WEIGHTS = {
    BASE_SCORE: 100,
    TURNS_MULTIPLIER: 20,
    TIME_PENALTY: 0.1,
    INVALID_WORD_PENALTY: 5,
    REUSED_ABSENT_PENALTY: 10,
    REUSED_WRONG_POS_PENALTY: 5
  } as const;
  
  export const calculateGameScore = (stats: GameStats): number => {
    if (!stats) return 0;
  
    // Base score starts at maximum (solving in 1 turn)
    let score = SCORING_WEIGHTS.BASE_SCORE;
  
    // Deduct points for each turn used (more turns = lower score)
    score -= (stats.turnsUsed - 1) * SCORING_WEIGHTS.TURNS_MULTIPLIER;
  
    // Time penalty (seconds)
    score -= Math.floor(stats.timeToComplete / 1000) * SCORING_WEIGHTS.TIME_PENALTY;
  
    // Penalties for mistakes
    score -= stats.invalidWordAttempts * SCORING_WEIGHTS.INVALID_WORD_PENALTY;
    score -= stats.reusedAbsentLetters * SCORING_WEIGHTS.REUSED_ABSENT_PENALTY;
    score -= stats.reusedWrongPositions * SCORING_WEIGHTS.REUSED_WRONG_POS_PENALTY;
  
    // Allow negative scores for this game
    return Math.round(score);
  };
  
  export const calculateRankChange = (
    currentScore: number,
    gameScore: number,
    currentTier: string
  ): number => {
    const baseChange = gameScore / 10;
    
    // Tier multipliers - harder to climb in higher tiers
    const tierMultipliers = {
      'Bronze': 1,
      'Silver': 0.8,
      'Gold': 0.6,
      'Platinum': 0.4,
      'Diamond': 0.2
    };
  
    const multiplier = tierMultipliers[currentTier as keyof typeof tierMultipliers] || 1;
    
    return Math.round(baseChange * multiplier);
  };