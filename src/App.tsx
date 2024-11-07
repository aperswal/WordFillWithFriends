// React and Core Dependencies
import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

// UI Components and Libraries
import { Toaster, toast } from 'react-hot-toast';
import { PlusCircle } from 'lucide-react';

// Custom Components
import Grid from './components/Grid';
import Keyboard from './components/Keyboard';
import ShareModal from './components/ShareModal';
import AuthModal from './components/AuthModal';
import Sidebar from './components/Sidebar';
import RankingSidebar from './components/RankingSidebar';
import ProfileModal from './components/ProfileModal';
import MobileMenu from './components/MobileMenu';
import {Menu} from 'lucide-react';

// Utils and Helpers
import { getRandomWord, isValidWord } from './utils/words';
import { calculateGameScore, calculateRankChange } from './utils/scoring';

// Firebase
import { auth, db } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  setDoc, 
  getDoc,
  updateDoc,
  limit, 
  orderBy, 
  startAt, 
  endAt 
} from 'firebase/firestore';

// Types
import type { 
  Game, 
  GameSeries, 
  GlobalRanking, 
  User
} from './types';

// Constants
import { TIER_THRESHOLDS, TierType } from './constants/tiers';

const getUniqueRandomWord = () => {
  const completedWords = JSON.parse(localStorage.getItem('completedWords') || '[]');
  let newWord = getRandomWord();
  let attempts = 0;
  
  // Try to find a new word up to 10 times
  while (completedWords.includes(newWord) && attempts < 10) {
    newWord = getRandomWord();
    attempts++;
  }
  
  // If all words are used, clear history
  if (attempts >= 10) {
    localStorage.setItem('completedWords', '[]');
  }
  
  return newWord;
};

function App() {
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const [currentGuess, setCurrentGuess] = useState('');
  const [games, setGames] = useState<Game[]>([]);
  const [series, setSeries] = useState<GameSeries[]>([]);
  const [topRankings, setTopRankings] = useState<GlobalRanking[]>([]);
  const [nearbyRankings, setNearbyRankings] = useState<GlobalRanking[]>([]);
  const [showProfile, setShowProfile] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [currentSeries, setCurrentSeries] = useState<GameSeries | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
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
  
    const userDoc = doc(db, 'users', auth.currentUser.uid);
    
    const unsubUser = onSnapshot(userDoc, (doc) => {
      if (doc.exists()) {
        setCurrentUser(doc.data() as User);
      } else {
        // Initialize new user
        const newUser = {
          uid: auth.currentUser.uid,
          email: auth.currentUser.email || '',
          username: auth.currentUser.displayName || `Player${Math.floor(Math.random() * 10000)}`,
          score: 0,
          gamesPlayed: 0,
          winRate: 0,
          tier: 'Bronze',
          iconId: 1,
          iconColor: 'blue',
          backgroundId: 1
        };
        setDoc(userDoc, newUser);
        setCurrentUser(newUser);
      }
    });
  
    return () => unsubUser();
  }, [auth.currentUser]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthInitialized(true);
    });
    return () => unsubscribe();
  }, []);

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
    if (!auth.currentUser) return;

    const rankingsRef = collection(db, 'rankings');
    
    // Get top 5 players
    const topQuery = query(rankingsRef, orderBy('score', 'desc'), limit(5));
    
    // Get nearby players (3 above and 3 below current user)
    const loadNearbyRankings = async () => {
      const userRank = (await getDoc(doc(db, 'users', auth.currentUser.uid))).data()?.rank;
      const nearbyQuery = query(
        rankingsRef,
        orderBy('rank'),
        startAt(Math.max(1, userRank - 3)),
        endAt(userRank + 3),
        limit(7)
      );
      
      onSnapshot(nearbyQuery, (snapshot) => {
        const rankings: GlobalRanking[] = [];
        snapshot.forEach(doc => rankings.push(doc.data() as GlobalRanking));
        setNearbyRankings(rankings);
      });
    };

    const unsubTop = onSnapshot(topQuery, (snapshot) => {
      const rankings: GlobalRanking[] = [];
      snapshot.forEach(doc => rankings.push(doc.data() as GlobalRanking));
      setTopRankings(rankings);
    });

    loadNearbyRankings();
    return () => unsubTop();
  }, [auth.currentUser]);

  useEffect(() => {
    const newUsedLetters: Record<string, 'correct' | 'present' | 'absent'> = {};
    
    currentGame.guesses.forEach(guess => {
      guess.split('').forEach((letter, index) => {
        // If letter is not in the word at all, mark it as absent
        if (!currentGame.word.toLowerCase().includes(letter.toLowerCase())) {
          newUsedLetters[letter] = 'absent';
        }
        // If it's in the correct position, mark it as correct
        else if (letter.toLowerCase() === currentGame.word[index].toLowerCase()) {
          newUsedLetters[letter] = 'correct';
        }
        // If it's in the word but not marked yet, mark it as present
        else if (!newUsedLetters[letter]) {
          newUsedLetters[letter] = 'present';
        }
      });
    });
  
    setUsedLetters(newUsedLetters);
  }, [currentGame.guesses, currentGame.word]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const seriesId = params.get('series');
    const gameId = params.get('game');
    
    if (seriesId && auth.currentUser) {
      const loadSeriesGame = async () => {
        const seriesDoc = await getDoc(doc(db, 'series', seriesId));
        if (seriesDoc.exists()) {
          const series = seriesDoc.data() as GameSeries;
          
          // If there's a specific game ID, load that game
          if (gameId) {
            const gameDoc = await getDoc(doc(db, 'games', gameId));
            if (gameDoc.exists()) {
              const game = gameDoc.data() as Game;
              setCurrentGame({
                ...game,
                guesses: [], // Reset guesses for the new player
                status: 'playing',
                seriesId: seriesId
              });
              setCurrentSeries(series);
              setSelectedSeriesId(seriesId);
            }
          } else {
            // Load the current game in the series
            setCurrentGame({
              id: series.currentGameId,
              word: series.currentWord || '',
              guesses: [],
              status: 'playing',
              createdAt: Date.now(),
              seriesId: seriesId
            });
            setCurrentSeries(series);
            setSelectedSeriesId(seriesId);
          }
        }
      };
      loadSeriesGame();
    }
  }, [auth.currentUser]);

  useEffect(() => {
    if (selectedSeriesId && auth.currentUser) {
      const loadSeriesGame = async () => {
        const seriesDoc = await getDoc(doc(db, 'series', selectedSeriesId));
        if (seriesDoc.exists()) {
          const series = seriesDoc.data() as GameSeries;
          setCurrentGame({
            id: series.currentGameId,
            word: series.currentWord,
            guesses: [],
            status: 'playing',
            createdAt: Date.now(),
            seriesId: selectedSeriesId
          });
          setCurrentSeries(series);
        }
      };
      loadSeriesGame();
    }
  }, [selectedSeriesId, auth.currentUser]);

  const handleKeyPress = (key: string) => {
    console.log('handleKeyPress called:', { key, status: currentGame.status, currentGuess });
    if (currentGame.status !== 'playing') {
      console.log('Game not in playing state, ignoring keypress');
      return;
    }
  
    if (key === 'ENTER') {
      handleSubmitGuess();
    } else if (key === '⌫') {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (currentGuess.length < 5) {
      setCurrentGuess(prev => prev + key);
    }
  };
  const countReusedAbsentLetters = (guess: string, usedLetters: Record<string, string>) => {
    return guess.split('').filter(letter => usedLetters[letter] === 'absent').length;
  };
  
  const countReusedWrongPositions = (guess: string, previousGuesses: string[]) => {
    let count = 0;
    previousGuesses.forEach(prevGuess => {
      for (let i = 0; i < guess.length; i++) {
        if (guess[i] === prevGuess[i] && guess[i] !== currentGame.word[i]) {
          count++;
        }
      }
    });
    return count;
  };
  
  const handleSubmitGuess = async () => {
    if (currentGuess.length !== 5) {
      toast.error('Word must be 5 letters!');
      return;
    }
  
    const upperGuess = currentGuess.toUpperCase();
    
    if (!isValidWord(upperGuess)) {
      setCurrentGame(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          invalidWordAttempts: (prev.stats?.invalidWordAttempts || 0) + 1
        }
      }));
      toast.error('Not a valid word!');
      return;
    }
  
    const newGuesses = [...currentGame.guesses, upperGuess];
    let newStatus = currentGame.status;
  
    // Calculate game statistics
    const gameStats = {
      invalidWordAttempts: currentGame.stats?.invalidWordAttempts || 0,
      reusedAbsentLetters: countReusedAbsentLetters(upperGuess, usedLetters),
      reusedWrongPositions: countReusedWrongPositions(upperGuess, currentGame.guesses),
      timeToComplete: Date.now() - currentGame.createdAt,
      turnsUsed: newGuesses.length
    };
  
    if (upperGuess === currentGame.word.toUpperCase()) {
      newStatus = 'won';
      toast.success('Congratulations!');
    } else if (newGuesses.length >= 6) {
      newStatus = 'lost';
      toast.error(`Game Over! The word was ${currentGame.word}`);
    }
  
    const updatedGame = {
      ...currentGame,
      guesses: newGuesses,
      status: newStatus,
      stats: gameStats
    };
  
    setCurrentGame(updatedGame);
    setCurrentGuess('');
  
    if (newStatus === 'won' || newStatus === 'lost') {
      setShowShare(true);
  
      if (auth.currentUser) {
        try {
          // Calculate score based on performance
          const gameScore = calculateGameScore(gameStats);
          
          // Get user data
          const userRef = doc(db, 'users', auth.currentUser.uid);
          const userDoc = await getDoc(userRef);
          const userData = userDoc.data() as User;
  
          // Calculate rank change based on performance and current tier
          const scoreChange = calculateRankChange(
            userData.score,
            gameScore,
            userData.tier || 'Bronze'
          );
  
          // Update user statistics
          const newScore = Math.max(0, userData.score + scoreChange); // Ensure total score doesn't go below 0
          const newGamesPlayed = userData.gamesPlayed + 1;
          const newWins = newStatus === 'won' ? (userData.wins || 0) + 1 : (userData.wins || 0);
          const newWinRate = (newWins / newGamesPlayed) * 100;
  
          // Determine new tier
          const newTier = Object.entries(TIER_THRESHOLDS)
            .sort(([,a], [,b]) => b - a)
            .find(([,threshold]) => newScore >= threshold)?.[0] || 'Bronze';
  
          // Show score change toast
          if (scoreChange > 0) {
            toast.success(`+${scoreChange} points!`, { icon: '📈' });
          } else if (scoreChange < 0) {
            toast.error(`${scoreChange} points`, { icon: '📉' });
          }
  
          // Update user document
          await updateDoc(userRef, {
            score: newScore,
            gamesPlayed: newGamesPlayed,
            wins: newWins,
            winRate: newWinRate,
            tier: newTier,
            lastGameAt: Date.now()
          });
  
          // Update global rankings
          const rankingRef = doc(db, 'rankings', auth.currentUser.uid);
          await setDoc(rankingRef, {
            userId: auth.currentUser.uid,
            username: userData.username,
            score: newScore,
            tier: newTier,
            iconId: userData.iconId,
            iconColor: userData.iconColor,
            backgroundId: userData.backgroundId,
            lastUpdated: Date.now()
          }, { merge: true });
  
          // Show tier change notification
          if (newTier !== userData.tier) {
            if (TIER_THRESHOLDS[newTier as keyof typeof TIER_THRESHOLDS] > 
                TIER_THRESHOLDS[userData.tier as keyof typeof TIER_THRESHOLDS]) {
              toast.success(`Promoted to ${newTier} Tier! 🎉`, {
                duration: 5000,
                icon: '🏆'
              });
            } else {
              toast.error(`Demoted to ${newTier} Tier`, {
                duration: 5000,
                icon: '⬇️'
              });
            }
          }
  
          // Save game data
          const gameRef = doc(db, 'games', updatedGame.id);
          const gameData = {
            ...updatedGame,
            userId: auth.currentUser.uid,
            scoreEarned: scoreChange,
            completedAt: Date.now(),
            stats: gameStats
          };
          await setDoc(gameRef, gameData);
  
          // Handle series updates
if (currentGame.seriesId) {
  const seriesRef = doc(db, 'series', currentGame.seriesId);
  const seriesDoc = await getDoc(seriesRef);
  
  if (seriesDoc.exists()) {
    const series = seriesDoc.data() as GameSeries;
    const isPlayer1 = series.player1 === auth.currentUser.uid;
    
    // Generate next game
    const nextGameId = uuidv4();
    const nextWord = getUniqueRandomWord();
    
    // Update series with new game and scores
    const updatedSeries = {
      ...series,
      currentGameId: nextGameId,
      currentWord: nextWord,
      games: [...series.games, {...gameData, seriesId: currentGame.seriesId}],
      [isPlayer1 ? 'player1Score' : 'player2Score']: 
        series[isPlayer1 ? 'player1Score' : 'player2Score'] + 
        (newStatus === 'won' ? 1 : 0),
      lastPlayedAt: Date.now()
    };

    await setDoc(seriesRef, updatedSeries);
    
    // Create next game
    const nextGame: Game = {
      id: nextGameId,
      word: nextWord,
      guesses: [],
      status: 'playing',
      createdAt: Date.now(),
      seriesId: currentGame.seriesId,
      stats: { invalidWordAttempts: 0 }
    };
    
    await setDoc(doc(db, 'games', nextGameId), nextGame);
    
    setTimeout(() => {
      setCurrentGame(nextGame);
      setCurrentSeries(updatedSeries);
      setShowShare(false);
    }, 2000);
            }
          } else if (currentGame.sharedBy) {
            // Create new series from shared game
            const seriesId = `${auth.currentUser.uid}_${currentGame.sharedBy}`.split('_').sort().join('_');
            const seriesRef = doc(db, 'series', seriesId);
            const seriesDoc = await getDoc(seriesRef);
  
            if (!seriesDoc.exists()) {
              // Create new series
              const nextGameId = uuidv4();
              const nextWord = getUniqueRandomWord();
              
              const newSeries: GameSeries = {
                id: seriesId,
                players: [auth.currentUser.uid, currentGame.sharedBy].sort(),
                playerNames: {
                  [auth.currentUser.uid]: userData.username,
                  [currentGame.sharedBy]: currentGame.sharedBy.split('@')[0]
                },
                currentGameId: nextGameId,
                currentWord: nextWord,
                player1: auth.currentUser.uid,
                player2: currentGame.sharedBy,
                player1Score: newStatus === 'won' ? 1 : 0,
                player2Score: 0,
                games: [gameData],
                lastPlayedAt: Date.now(),
                status: 'active'
              };
  
              // Create next game
              const nextGame: Game = {
                id: nextGameId,
                word: nextWord,
                guesses: [],
                status: 'playing',
                createdAt: Date.now(),
                seriesId: seriesId,
                stats: { invalidWordAttempts: 0 }
              };
  
              await setDoc(seriesRef, newSeries);
              await setDoc(doc(db, 'games', nextGameId), nextGame);
  
              setTimeout(() => {
                setCurrentGame(nextGame);
                setCurrentSeries(newSeries);
                setShowShare(false);
              }, 2000);
            }
          }
  
        } catch (err) {
          console.error('Error updating data:', err);
          toast.error('Failed to update game data');
        }
      }
    }
  };

  const startNewGame = () => {
    if (currentGame.status === 'won') {
      const completedWords = JSON.parse(localStorage.getItem('completedWords') || '[]');
      completedWords.push(currentGame.word);
      localStorage.setItem('completedWords', JSON.stringify(completedWords));
    }
  
    setCurrentGame({
      id: uuidv4(),
      word: getUniqueRandomWord(),
      guesses: [],
      status: 'playing',
      createdAt: Date.now()
    });
    setCurrentGuess('');
    setUsedLetters({});
    setShowShare(false);
    
    // Add focus shift
    if (gameAreaRef.current) {
      gameAreaRef.current.focus();
    }
  };

useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (showProfile || showAuth || showShare) {
      return; // Don't handle keyboard events when modals are open
    }
    
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
}, [handleKeyPress, showProfile, showAuth, showShare]); // Add modal states to dependencies

if (!authInitialized) {
  return (
    <div className="h-screen w-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
  );
}

return (
  <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
    {auth.currentUser && (
      <>
        <div className="hidden md:block">
          <Sidebar
            series={series}
            currentUserId={auth.currentUser.uid}
            onSelectSeries={setSelectedSeriesId}
            selectedSeriesId={selectedSeriesId}
          />
        </div>
        
        {showMobileMenu && (
          <MobileMenu
            isOpen={showMobileMenu}
            onClose={() => setShowMobileMenu(false)}
            series={series}
            currentUserId={auth.currentUser.uid}
            onSelectSeries={setSelectedSeriesId}
            selectedSeriesId={selectedSeriesId}
          />
        )}
      </>
    )}
    
    <div className="flex-1 flex flex-col">
      <header className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            {auth.currentUser && (
              <button
                onClick={() => setShowMobileMenu(true)}
                className="md:hidden p-2 text-gray-500 hover:text-gray-700 rounded-lg"
              >
                <Menu className="w-6 h-6" />
              </button>
            )}
            <h1 className="text-2xl font-bold">Word Fill w/ Friends</h1>
          </div>
          <div className="flex gap-2">
            {!auth.currentUser ? (
              <button
                onClick={() => setShowAuth(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
              >
                Sign In
              </button>
            ) : (
              <button
                onClick={() => setShowProfile(true)}
                className="px-4 py-2 bg-gray-100 rounded-lg font-semibold hover:bg-gray-200"
              >
                Profile
              </button>
            )}
            <button
              onClick={startNewGame}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg font-semibold hover:bg-gray-200"
            >
              <PlusCircle className="w-5 h-5" />
              <span className="hidden sm:inline">New Game</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto">
  <div 
    ref={gameAreaRef}
    tabIndex={-1}
    className="max-w-4xl mx-auto p-4 outline-none"
  >
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

    {auth.currentUser && (
      <div className="hidden md:block">
        <RankingSidebar
          currentUser={currentUser}
          topRankings={topRankings}
          nearbyRankings={nearbyRankings}
        />
      </div>
    )}

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

    {showProfile && auth.currentUser && (
      <ProfileModal 
        onClose={() => setShowProfile(false)}
        currentUser={currentUser}
      />
    )}
  </div>
);
}

export default App;