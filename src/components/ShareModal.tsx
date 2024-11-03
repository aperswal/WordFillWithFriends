import React, { useState } from 'react';
import { X, Copy, Mail, Share } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { doc, setDoc, addDoc, collection } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

interface ShareModalProps {
  game: Game;
  onClose: () => void;
  onShowAuth?: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ game, onClose, onShowAuth }) => {
  const [email, setEmail] = useState('');
  
  const getGamePattern = () => {
    return game.guesses
      .map(guess => {
        return guess.split('')
          .map((letter, i) => {
            if (letter === game.word[i]) return '🟩';
            if (game.word.includes(letter)) return '🟨';
            return '⬜';
          })
          .join('');
      })
      .join('\n');
  };

  const shareUrl = `${window.location.origin}?game=${game.id}`;

  const handleShare = async (method: 'copy' | 'email' | 'native') => {
    const score = game.guesses.length;
    const challengeText = `I solved Word Fill w/ Friends in ${score}/6 tries!\n\nCan you beat my score?\n`;
    const text = `${challengeText}\n${getGamePattern()}\n\nPlay this word: ${shareUrl}`;
    
    if (method === 'email') {
      if (!auth.currentUser) {
        // Instead of immediately showing auth, open email client
        const emailSubject = "Challenge: Can you beat my Word Fill w/ Friends score?";
        const emailBody = `Hey!\n\n${text}\n\nGood luck!\n\nSign up to track and compare scores: ${window.location.origin}`;
        window.location.href = `mailto:${email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
        setEmail('');
        return;
      }
      
      try {
        // Save share data if user is signed in
        await setDoc(doc(db, 'games', game.id), {
          ...game,
          userId: auth.currentUser.uid,
          sharedWith: [...(game.sharedWith || []), email]
        });
  
        await addDoc(collection(db, 'shares'), {
          gameId: game.id,
          sharedBy: auth.currentUser.uid,
          sharedWith: email,
          sharedAt: Date.now()
        });
        
        const emailSubject = "Challenge: Can you beat my Word Fill w/ Friends score?";
        const emailBody = `Hey!\n\n${text}\n\nGood luck!`;
        window.location.href = `mailto:${email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
        
        setEmail('');
        toast.success('Game shared via email!');
      } catch (err) {
        console.error('Share error:', err);
        toast.error('Failed to share game');
      }
    } else if (method === 'native' && navigator.share) {
      try {
        await navigator.share({ text });
        toast.success('Shared successfully!');
      } catch (err) {
        await navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard!');
      }
    } else {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    }
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