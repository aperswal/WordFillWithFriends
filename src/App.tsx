import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Toaster, toast } from 'react-hot-toast';
import { PlusCircle } from 'lucide-react';
import Grid from './components/Grid';
import Keyboard from './components/Keyboard';
import ShareModal from './components/ShareModal';
import AuthModal from './components/AuthModal';
import Sidebar from './components/Sidebar';
import { getRandomWord, isValidWord } from './utils/words';
import { auth, db } from './lib/firebase';
import { collection, query, where, onSnapshot, doc, setDoc } from 'firebase/firestore';
import type { Game, GameSeries } from './types';

function App() {
  const [currentGuess, setCurrentGuess] = useState('');
  const [games, setGames] = useState<Game[]>([]);
  const [series, setSeries] = useState<GameSeries[]>([]);
  const [currentGame, setCurrentGame] = useState<Game>({
    id: uuidv4(),
    word: getRandomWord(),
    guesses: [],
    status: 'playing',
    createdAt: Date.now()
  });
  const [showShare, setShowShare] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>();
  const [usedLetters, setUsedLetters] = useState<Record<string, 'correct' | 'present' | 'absent'>>({});

  useEffect(() => {
    if (!auth.currentUser) return;

    const gamesQuery = query(
      collection(db, 'games'),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubGames = onSnapshot(gamesQuery, (snapshot) => {
      const newGames: Game[] = [];
      snapshot.forEach((doc) => {
        newGames.push(doc.data() as Game);
      });
      setGames(newGames);
    });

    const seriesQuery = query(
      collection(db, 'series'),
      where('players', 'array-contains', auth.currentUser.uid)
    );

    const unsubSeries = onSnapshot(seriesQuery, (snapshot) => {
      const newSeries: GameSeries[] = [];
      snapshot.forEach((doc) => {
        newSeries.push(doc.data() as GameSeries);
      });
      setSeries(newSeries);
    });

    return () => {
      unsubGames();
      unsubSeries();
    };
  }, []);

  useEffect(() => {
    const newUsedLetters: Record<string, 'correct' | 'present' | 'absent'> = {};
    
    currentGame.guesses.forEach(guess => {
      guess.split('').forEach((letter, index) => {
        if (letter === currentGame.word[index]) {
          newUsedLetters[letter] = 'correct';
        } else if (currentGame.word.includes(letter)) {
          if (newUsedLetters[letter] !== 'correct') {
            newUsedLetters[letter] = 'present';
          }
        } else {
          if (!newUsedLetters[letter]) {
            newUsedLetters[letter] = 'absent';
          }
        }
      });
    });

    setUsedLetters(newUsedLetters);
  }, [currentGame.guesses, currentGame.word]);

  const handleKeyPress = (key: string) => {
    if (currentGame.status !== 'playing') return;

    if (key === 'ENTER') {
      handleSubmitGuess();
    } else if (key === '⌫') {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (currentGuess.length < 5) {
      setCurrentGuess(prev => prev + key);
    }
  };

  const handleSubmitGuess = async () => {
    if (currentGuess.length !== 5) {
      toast.error('Word must be 5 letters!');
      return;
    }

    if (!isValidWord(currentGuess)) {
      toast.error('Not a valid word!');
      return;
    }

    const newGuesses = [...currentGame.guesses, currentGuess];
    let newStatus = currentGame.status;

    if (currentGuess === currentGame.word) {
      newStatus = 'won';
      setShowShare(true);
    } else if (newGuesses.length >= 6) {
      newStatus = 'lost';
      toast.error(`Game Over! The word was ${currentGame.word}`);
      setShowShare(true);
    }

    const updatedGame = { ...currentGame, guesses: newGuesses, status: newStatus };
    
    if (auth.currentUser) {
      await setDoc(doc(db, 'games', updatedGame.id), {
        ...updatedGame,
        userId: auth.currentUser.uid
      });
    }
    
    setGames(prev => {
      const existing = prev.findIndex(g => g.id === currentGame.id);
      if (existing >= 0) {
        const newGames = [...prev];
        newGames[existing] = updatedGame;
        return newGames;
      }
      return [...prev, updatedGame];
    });
    
    setCurrentGuess('');
  };

  const startNewGame = () => {
    setCurrentGame({
      id: uuidv4(),
      word: getRandomWord(),
      guesses: [],
      status: 'playing',
      createdAt: Date.now()
    });
    setCurrentGuess('');
    setShowShare(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleKeyPress('ENTER');
      } else if (e.key === 'Backspace') {
        handleKeyPress('⌫');
      } else if (/^[A-Za-z]$/.test(e.key)) {
        handleKeyPress(e.key.toUpperCase());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentGuess, currentGame.status]);

  return (
    <div className="flex h-screen bg-gray-50">
      {auth.currentUser && (
        <Sidebar
          series={series}
          currentUserId={auth.currentUser.uid}
          onSelectSeries={setSelectedSeriesId}
          selectedSeriesId={selectedSeriesId}
        />
      )}
      
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 p-4">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold">Word Fill w/ Friends</h1>
            <div className="flex gap-2">
              {!auth.currentUser && (
                <button
                  onClick={() => setShowAuth(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
                >
                  Sign In
                </button>
              )}
              <button
                onClick={startNewGame}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg font-semibold hover:bg-gray-200"
              >
                <PlusCircle className="w-5 h-5" />
                New Game
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto p-4">
            <Grid
              word={currentGame.word}
              guesses={currentGame.guesses}
              currentGuess={currentGuess}
            />
            <Keyboard
              onKeyPress={handleKeyPress}
              usedLetters={usedLetters}
            />
          </div>
        </main>
      </div>

      <Toaster position="top-center" />
      
      {showShare && (
        <ShareModal
          game={currentGame}
          onClose={() => setShowShare(false)}
          onShowAuth={() => {
            setShowShare(false);
            setShowAuth(true);
          }}
        />
      )}
      
      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)} />
      )}
    </div>
  );
}

export default App;