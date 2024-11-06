import React from 'react';
import { 
  Trophy, Crown, User as UserIcon, Smile, Heart, Star, Sun, Moon, Cloud,
  Zap, Flame, Droplet, Leaf, Bird, Cat,
  Dog, Fish, Flower, Mountain, Waves, Rainbow, 
  Music, Book, GamepadIcon, Diamond 
} from 'lucide-react';
import type { GlobalRanking, User } from '../types';
import { TIER_THRESHOLDS, TierType } from '../constants/tiers';

interface RankingSidebarProps {
  currentUser: User;
  topRankings: GlobalRanking[];
  nearbyRankings: GlobalRanking[];
}

const ICONS = [
  { icon: Smile, name: 'Smile' },
  { icon: Heart, name: 'Heart' },
  { icon: Star, name: 'Star' },
  { icon: Sun, name: 'Sun' },
  { icon: Moon, name: 'Moon' },
  { icon: Cloud, name: 'Cloud' },
  { icon: Zap, name: 'Lightning' },
  { icon: Flame, name: 'Fire' },
  { icon: Droplet, name: 'Water' },
  { icon: Leaf, name: 'Leaf' },
  { icon: Bird, name: 'Bird' },
  { icon: Cat, name: 'Cat' },
  { icon: Dog, name: 'Dog' },
  { icon: Fish, name: 'Fish' },
  { icon: Flower, name: 'Flower' },
  { icon: Mountain, name: 'Mountain' },
  { icon: Waves, name: 'Ocean' },
  { icon: Rainbow, name: 'Rainbow' },
  { icon: Music, name: 'Music' },
  { icon: Book, name: 'Book' },
  { icon: GamepadIcon, name: 'Game' },
  { icon: Crown, name: 'Crown' },
  { icon: Diamond, name: 'Diamond' }
];

const RankingSidebar: React.FC<RankingSidebarProps> = ({ currentUser, topRankings, nearbyRankings }) => {
  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Diamond': return 'text-blue-500';
      case 'Platinum': return 'text-cyan-500';
      case 'Gold': return 'text-yellow-500';
      case 'Silver': return 'text-gray-400';
      default: return 'text-amber-700';
    }
  };

  const getTierProgress = (score: number, tier: string) => {
    const tiers = Object.entries(TIER_THRESHOLDS);
    const currentTierIndex = tiers.findIndex(([t]) => t === tier);
    const nextTier = tiers[currentTierIndex - 1];
    
    if (!nextTier) return 100; // Already at highest tier
    
    const currentThreshold = TIER_THRESHOLDS[tier as keyof typeof TIER_THRESHOLDS];
    const nextThreshold = TIER_THRESHOLDS[nextTier[0] as keyof typeof TIER_THRESHOLDS];
    const progress = ((score - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
    
    return Math.min(Math.max(progress, 0), 100);
  };

  const getTierRank = (player: GlobalRanking, rankings: GlobalRanking[]) => {
    const tierPlayers = rankings.filter(r => r.tier === player.tier);
    const playerIndex = tierPlayers.findIndex(r => r.userId === player.userId);
    return playerIndex >= 0 ? playerIndex + 1 : tierPlayers.length + 1;
  };

  const getNextTier = (tier: string) => {
    const tiers = Object.keys(TIER_THRESHOLDS);
    const currentIndex = tiers.indexOf(tier);
    return currentIndex > 0 ? tiers[currentIndex - 1] : tier;
  };

  const renderPlayerIcon = (player: GlobalRanking) => {
    const IconComponent = ICONS[player.iconId - 1]?.icon || UserIcon;
    const progress = getTierProgress(player.score, player.tier);
    
    return (
      <div className="flex items-center gap-2">
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ 
            backgroundColor: player.iconColor,
            color: 'white'
          }}
        >
          <IconComponent className="w-5 h-5" />
        </div>
        {player.userId === currentUser.uid && (
          <div className="flex-1">
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-600 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {Math.floor(progress)}% to {getNextTier(player.tier)}
            </div>
          </div>
        )}
      </div>
    );
  };
  
    return (
      <div className="w-80 bg-white border-l border-gray-200 h-screen overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Global Rankings
          </h2>
        </div>
  
        <div className="p-4">
          <h3 className="font-semibold mb-2 flex items-center gap-1">
            <Crown className="w-4 h-4 text-yellow-500" />
            Top Players
          </h3>
          
          {topRankings.map(player => (
            <div key={player.userId} className="flex items-center gap-2 p-2 rounded-lg mb-2">
              {renderPlayerIcon(player)}
              <div className="flex-1">
                <div className="font-medium">{player.username}</div>
                <div className="text-sm text-gray-500 flex items-center gap-1">
                  <span className={getTierColor(player.tier)}>{player.tier}</span>
                  <span>•</span>
                  <span>{player.score.toLocaleString()} pts</span>
                  <span>•</span>
                  <span>#{player.rank}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
  
        <div className="p-4 border-t border-gray-200">
          <h3 className="font-semibold mb-2">Your Ranking</h3>
          
          {nearbyRankings.map(player => (
            <div 
              key={player.userId} 
              className={`flex items-center gap-2 p-2 rounded-lg mb-2 ${
                player.userId === currentUser.uid ? 'bg-indigo-50' : ''
              }`}
            >
              {renderPlayerIcon(player)}
              <div className="flex-1">
                <div className="font-medium">{player.username}</div>
                <div className="text-sm text-gray-500 flex items-center gap-1">
                  <span className={getTierColor(player.tier)}>{player.tier}</span>
                  <span>•</span>
                  <span>{player.score.toLocaleString()} pts</span>
                  <span>•</span>
                  <span>#{player.rank}</span>
                </div>
              </div>
              <div className="text-lg font-bold">#{player.rank}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  export default RankingSidebar;