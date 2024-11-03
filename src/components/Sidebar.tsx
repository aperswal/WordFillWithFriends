import React from 'react';
import { Users, Trophy } from 'lucide-react';
import type { GameSeries } from '../types';

interface SidebarProps {
  series: GameSeries[];
  currentUserId: string;
  onSelectSeries: (seriesId: string) => void;
  selectedSeriesId?: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  series,
  currentUserId,
  onSelectSeries,
  selectedSeriesId
}) => {
  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Users className="w-5 h-5" />
          Game Series
        </h2>
      </div>
      
      <div className="p-2">
        {series.map((s) => {
          const isPlayer1 = s.player1 === currentUserId;
          const myScore = isPlayer1 ? s.player1Score : s.player2Score;
          const theirScore = isPlayer1 ? s.player2Score : s.player1Score;
          const opponent = isPlayer1 ? s.player2 : s.player1;
          
          return (
            <button
              key={s.id}
              onClick={() => onSelectSeries(s.id)}
              className={`w-full p-3 rounded-lg mb-2 text-left ${
                selectedSeriesId === s.id
                  ? 'bg-indigo-50 border-indigo-200'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium truncate">
                  {s.playerNames[opponent] || opponent}
                </span>
                <div className="flex items-center gap-1 text-yellow-500">
                  <Trophy className="w-4 h-4" />
                  <span className="text-sm font-semibold">
                    {myScore} - {theirScore}
                  </span>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {s.games.length} games played
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Sidebar;