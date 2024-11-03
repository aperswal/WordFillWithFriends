// React and Core Dependencies
import React, { useState, useEffect } from 'react';
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

// Firebase
import { auth, db } from './lib/firebase';
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

function App() {
  const [currentGuess, setCurrentGuess] = useState('');
  const [games, setGames] = useState<Game[]>([]);
  const [series, setSeries] = useState<GameSeries[]>([]);
  const [topRankings, setTopRankings] = useState<GlobalRanking[]>([]);
  const [nearbyRankings, setNearbyRankings] = useState<GlobalRanking[]>([]);
  const [showProfile, setShowProfile] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedGameId = params.get('game');
    
    if (sharedGameId && auth.currentUser) {
      const loadSharedGame = async () => {
        const gameDoc = await getDoc(doc(db, 'games', sharedGameId));
        if (gameDoc.exists()) {
          const sharedGame = gameDoc.data() as Game;
          setCurrentGame({
            id: uuidv4(),
            word: sharedGame.word,
            guesses: [],
            status: 'playing',
            createdAt: Date.now(),
            sharedBy: sharedGame.userId
          });
        }
      };
      loadSharedGame();
    }
  }, [auth.currentUser]);

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
  const handleSubmitGuess = async () => {
    if (currentGuess.length !== 5) {
      toast.error('Word must be 5 letters!');
      return;
    }
  
    const upperGuess = currentGuess.toUpperCase();
    
    if (!isValidWord(upperGuess)) {
      toast.error('Not a valid word!');
      return;
    }
  
    const newGuesses = [...currentGame.guesses, upperGuess];
    let newStatus = currentGame.status;
    let scoreIncrease = 0;
  
    if (upperGuess === currentGame.word) {
      newStatus = 'won';
      scoreIncrease = Math.max(7 - newGuesses.length, 1) * 100;
      toast.success('Congratulations!');
    } else if (newGuesses.length >= 6) {
      newStatus = 'lost';
      scoreIncrease = 10;
      toast.error(`Game Over! The word was ${currentGame.word}`);
    }
  
    const updatedGame = {
      ...currentGame,
      guesses: newGuesses,
      status: newStatus
    };
  
    setCurrentGame(updatedGame);
    setCurrentGuess('');
  
    if (newStatus === 'won' || newStatus === 'lost') {
      setShowShare(true);
  
      if (auth.currentUser) {
        try {
          // Update user stats
          const userRef = doc(db, 'users', auth.currentUser.uid);
          const userDoc = await getDoc(userRef);
          const userData = userDoc.data() as User;
          
          const newScore = userData.score + scoreIncrease;
          const newGamesPlayed = userData.gamesPlayed + 1;
          const newWins = newStatus === 'won' ? (userData.wins || 0) + 1 : (userData.wins || 0);
          const newWinRate = (newWins / newGamesPlayed) * 100;
          
          const newTier = Object.entries(TIER_THRESHOLDS)
            .sort(([,a], [,b]) => b - a)
            .find(([,threshold]) => newScore >= threshold)?.[0] || 'Bronze';
  
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
  
          if (newTier !== userData.tier) {
            toast.success(`Promoted to ${newTier} Tier! 🎉`, {
              duration: 5000,
              icon: '🏆'
            });
          }
  
          // Save game data
          const gameRef = doc(db, 'games', updatedGame.id);
          await setDoc(gameRef, {
            ...updatedGame,
            userId: auth.currentUser.uid,
            scoreEarned: scoreIncrease,
            completedAt: Date.now()
          });
  
          // Update series if game was shared
          if (currentGame.sharedBy) {
            const seriesId = `${auth.currentUser.uid}_${currentGame.sharedBy}`.split('_').sort().join('_');
            const seriesRef = doc(db, 'series', seriesId);
            const seriesDoc = await getDoc(seriesRef);
            
            const seriesGame = {
              id: currentGame.id,
              word: currentGame.word,
              guesses: newGuesses,
              winner: newStatus === 'won' ? auth.currentUser.uid : null,
              score: newStatus === 'won' ? 6 - newGuesses.length : 0,
              completedAt: Date.now()
            };
  
            if (seriesDoc.exists()) {
              const series = seriesDoc.data() as GameSeries;
              const isPlayer1 = series.player1 === auth.currentUser.uid;
              
              await updateDoc(seriesRef, {
                games: [...series.games, seriesGame],
                player1Score: isPlayer1 
                  ? series.player1Score + (newStatus === 'won' ? seriesGame.score : 0)
                  : series.player1Score,
                player2Score: !isPlayer1 
                  ? series.player2Score + (newStatus === 'won' ? seriesGame.score : 0)
                  : series.player2Score,
                lastPlayedAt: Date.now()
              });
            } else {
              // Create new series
              const opponent = await getDoc(doc(db, 'users', currentGame.sharedBy));
              const opponentData = opponent.data() as User;
              
              await setDoc(seriesRef, {
                id: seriesId,
                player1: currentGame.sharedBy,
                player2: auth.currentUser.uid,
                playerNames: {
                  [currentGame.sharedBy]: opponentData.username || 'Unknown',
                  [auth.currentUser.uid]: userData.username || 'Unknown'
                },
                player1Score: 0,
                player2Score: newStatus === 'won' ? seriesGame.score : 0,
                games: [seriesGame],
                lastPlayedAt: Date.now()
              });
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
    setCurrentGame({
      id: uuidv4(),
      word: getRandomWord(),
      guesses: [],
      status: 'playing',
      createdAt: Date.now()
    });
    setCurrentGuess('');
    setUsedLetters({});
    setShowShare(false);
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