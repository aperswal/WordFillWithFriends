export const TIER_THRESHOLDS = {
    Diamond: 10000,
    Platinum: 5000,
    Gold: 2000,
    Silver: 500,
    Bronze: 0
} as const;
  
export type TierType = keyof typeof TIER_THRESHOLDS;