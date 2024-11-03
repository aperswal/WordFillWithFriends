import React, { useState } from 'react';
import { Share2, X, Mail, Copy, MessageCircle } from 'lucide-react';
import type { Game } from '../types';
import { auth, db } from '../lib/firebase';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';

interface ShareModalProps {
  game: Game;
  onClose: () => void;
  onShowAuth?: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ game, onClose, onShowAuth }) => {
  const [email, setEmail] = useState('');
  const shareUrl = `${window.location.origin}?game=${game.id}`;
  
  const getGamePattern = () => {
    return game.guesses.map(guess => {
      return guess.split('').map((letter, i) => {
        if (letter === game.word[i]) return '🟩';
        if (game.word.includes(letter)) return '🟨';
        return '⬛';
      }).join('');
    }).join('\n');
  };

  const handleShare = async (method: 'copy' | 'email' | 'native') => {
    const text = `Word Fill w/ Friends\n\n${getGamePattern()}\n\nPlay this word: ${shareUrl}`;
    
    if (method === 'native' && navigator.share) {
      try {
        await navigator.share({ text });
      } catch (err) {
        await navigator.clipboard.writeText(text);
      }
    } else if (method === 'email') {
      if (!auth.currentUser) {
        onShowAuth?.();
        return;
      }
      
      try {
        await addDoc(collection(db, 'shares'), {
          gameId: game.id,
          sharedBy: auth.currentUser.uid,
          sharedWith: email,
          sharedAt: Date.now()
        });
        
        await updateDoc(doc(db, 'games', game.id), {
          sharedWith: [...(game.sharedWith || []), email]
        });
        
        setEmail('');
      } catch (err) {
        console.error('Share error:', err);
      }
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Share your result!</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="mb-6 font-mono whitespace-pre bg-gray-100 p-4 rounded">
          {getGamePattern()}
        </div>

        <div className="space-y-4">
          <button
            onClick={() => handleShare('native')}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-indigo-700"
          >
            <Share2 className="w-5 h-5" />
            Share Result
          </button>
          
          <div className="flex gap-2">
            <button
              onClick={() => handleShare('copy')}
              className="flex-1 bg-gray-100 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-gray-200"
            >
              <Copy className="w-5 h-5" />
              Copy
            </button>
            
            <button
              onClick={() => window.location.href = `mailto:?body=${encodeURIComponent(`Play Word Fill w/ Friends with me!\n\n${shareUrl}`)}`}
              className="flex-1 bg-gray-100 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-gray-200"
            >
              <Mail className="w-5 h-5" />
              Email
            </button>
            
            <button
              onClick={() => window.location.href = `sms:?body=${encodeURIComponent(`Play Word Fill w/ Friends with me!\n\n${shareUrl}`)}`}
              className="flex-1 bg-gray-100 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-gray-200"
            >
              <MessageCircle className="w-5 h-5" />
              Message
            </button>
          </div>

          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter friend's email"
              className="w-full px-4 py-2 border rounded-lg"
            />
            <button
              onClick={() => handleShare('email')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-600 hover:text-indigo-700"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;