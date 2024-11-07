import React, { useState } from 'react';
import { X, Copy, Mail, Share } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { Game, GameSeries } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface ShareModalProps {
  game: Game;
  onClose: () => void;
  onShowAuth?: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ game, onClose, onShowAuth }) => {
  const [email, setEmail] = useState('');
  
  const getGamePattern = () => {
    const getSquareColor = (guess: string, index: number) => {
      // First pass: mark exact matches
      const exactMatches = new Set();
      for (let i = 0; i < game.word.length; i++) {
        if (guess[i].toUpperCase() === game.word[i].toUpperCase()) {
          exactMatches.add(i);
        }
      }

      // If this is an exact match, return green
      if (guess[index].toUpperCase() === game.word[index].toUpperCase()) {
        return '🟩';
      }

      // Check if this letter can be yellow
      if (game.word.toUpperCase().includes(guess[index].toUpperCase()) && !exactMatches.has(index)) {
        // Count how many of this letter we've used before this position
        let usedCount = 0;
        for (let i = 0; i < index; i++) {
          if (guess[i].toUpperCase() === guess[index].toUpperCase() && 
              !exactMatches.has(i) && 
              game.word.toUpperCase().includes(guess[index].toUpperCase())) {
            usedCount++;
          }
        }

        // Count how many of this letter are in the word
        const letterCount = game.word.toUpperCase().split('')
          .filter(l => l === guess[index].toUpperCase()).length;

        // If we haven't used up all instances of this letter, show yellow
        if (usedCount < letterCount) {
          return '🟨';
        }
      }

      return '⬛';
    };

    return game.guesses.map(guess => 
      guess.split('').map((_, i) => getSquareColor(guess, i)).join('')
    ).join('\n');
  };

  const shareUrl = `${window.location.origin}?game=${game.id}`;

  const handleShare = async (method: 'copy' | 'email' | 'native') => {
    // Generate share text
    const score = game.guesses.length;
    const challengeText = `I solved Word Fill w/ Friends in ${score}/6 tries!\n\nCan you beat my score?\n`;
    const pattern = getGamePattern();
    
    // Handle email sharing
    if (method === 'email') {
      if (!auth.currentUser) {
        handleAnonymousEmailShare(challengeText, pattern);
        return;
      }
      
      try {
        const seriesId = await handleSeriesCreation(email);
        const shareUrl = `${window.location.origin}?series=${seriesId}&game=${game.id}`;
        
        // Send email with series link
        const emailSubject = "Challenge: Can you beat my Word Fill w/ Friends score?";
        const emailBody = `Hey!\n\n${challengeText}\n${pattern}\n\nClick here to play this word and start our series: ${shareUrl}\n\nGood luck!`;
        
        window.location.href = `mailto:${email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
        setEmail('');
        toast.success('Game shared via email!');
      } catch (err) {
        console.error('Share error:', err);
        toast.error('Failed to share game');
      }
      return;
    }
  
    // Handle native sharing and clipboard
    const text = `${challengeText}\n${pattern}\n\nPlay at: ${window.location.origin}`;
    
    if (method === 'native' && navigator.share) {
      try {
        await navigator.share({ text });
        toast.success('Shared successfully!');
      } catch {
        await copyToClipboard(text);
      }
    } else {
      await copyToClipboard(text);
    }
  };
  
  const handleAnonymousEmailShare = (challengeText: string, pattern: string) => {
    const emailSubject = "Challenge: Can you beat my Word Fill w/ Friends score?";
    const emailBody = `Hey!\n\n${challengeText}\n${pattern}\n\nSign up to track and compare scores: ${window.location.origin}\n\nGood luck!`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    setEmail('');
  };
  
  const handleSeriesCreation = async (recipientEmail: string): Promise<string> => {
    if (!auth.currentUser) throw new Error('No authenticated user');
  
    const seriesId = `${auth.currentUser.uid}_${recipientEmail}`.split('_').sort().join('_');
    const seriesRef = doc(db, 'series', seriesId);
    
    // Create initial game for recipient with same word
    const newGameId = uuidv4();
    const newGame = {
      id: newGameId,
      word: game.word,
      guesses: [],
      status: 'playing',
      createdAt: Date.now(),
      seriesId,
      sharedBy: auth.currentUser.uid,
      sharedWith: [recipientEmail]
    };
  
    const newSeries: GameSeries = {
      id: seriesId,
      players: [auth.currentUser.uid, recipientEmail].sort(),
      playerNames: {
        [auth.currentUser.uid]: auth.currentUser.displayName || 'Player 1',
        [recipientEmail]: recipientEmail.split('@')[0]
      },
      currentGameId: newGameId,
      currentWord: game.word,
      player1: auth.currentUser.uid,
      player2: recipientEmail,
      player1Score: game.status === 'won' ? 1 : 0,
      player2Score: 0,
      games: [{...game, seriesId}], // Add seriesId to the original game
      lastPlayedAt: Date.now(),
      status: 'active'
    };
  
    await setDoc(seriesRef, newSeries);
    await setDoc(doc(db, 'games', newGameId), newGame);
  
    return seriesId;
  };
  
  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-4 sm:p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 sm:top-4 sm:right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold mb-4">Share Your Result!</h2>
        
        <div className="mb-4 sm:mb-6">
          <pre className="font-mono text-xs sm:text-sm bg-gray-100 p-2 sm:p-4 rounded-lg overflow-x-auto">
            {getGamePattern()}
          </pre>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Share via Email
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="friend@example.com"
                className="flex-1 px-3 py-2 border rounded-lg"
              />
              <button
                onClick={() => handleShare('email')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Mail className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleShare('copy')}
              className="flex-1 px-4 py-2 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 flex items-center justify-center gap-2"
            >
              <Copy className="w-5 h-5" />
              Copy Result
            </button>
            
            {navigator.share && (
              <button
                onClick={() => handleShare('native')}
                className="flex-1 px-4 py-2 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 flex items-center justify-center gap-2"
              >
                <Share className="w-5 h-5" />
                Share
              </button>
            )}
          </div>

          {!auth.currentUser && (
            <div className="mt-6 pt-4 border-t">
              <p className="text-sm text-gray-600 mb-2">
                Sign in to track scores and see if your friends beat you!
              </p>
              <button
                onClick={onShowAuth}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
              >
                Sign In to Track Scores
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareModal;