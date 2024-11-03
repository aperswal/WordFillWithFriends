import React from 'react';
import { X } from 'lucide-react';
import type { GameSeries } from '../types';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  series: GameSeries[];
  currentUserId: string;
  onSelectSeries: (id: string) => void;
  selectedSeriesId?: string;
}

const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  series,
  currentUserId,
  onSelectSeries,
  selectedSeriesId
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      
      <div className="fixed inset-y-0 left-0 w-72 bg-white shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Games</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {series.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                onSelectSeries(s.id);
                onClose();
              }}
              className={`
                w-full px-4 py-2 rounded-lg text-left
                ${selectedSeriesId === s.id 
                  ? 'bg-indigo-50 text-indigo-600' 
                  : 'hover:bg-gray-50'
                }
              `}
            >
              <div className="font-medium">
                {s.players.includes(currentUserId) ? 'Game with ' : ''}
                {s.players
                  .filter(id => id !== currentUserId)
                  .map(id => s.playerNames?.[id] || 'Unknown')
                  .join(', ')}
              </div>
              <div className="text-sm text-gray-500">
                {new Date(s.lastPlayedAt).toLocaleDateString()}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;