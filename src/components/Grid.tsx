import React from 'react';

interface GridProps {
  word: string;
  guesses: string[];
  currentGuess: string;
}

const Grid: React.FC<GridProps> = ({ word, guesses, currentGuess }) => {
  const remainingRows = Math.max(0, 6 - (guesses.length + 1));
  
  const guessRows = guesses.map(g => g.split(''));
  const currentGuessArray = currentGuess 
    ? currentGuess.split('').concat(Array(5 - currentGuess.length).fill('')) 
    : Array(5).fill('');
  const emptyRows = Array(remainingRows).fill(Array(5).fill(''));
  
  const allRows = [...guessRows];
  if (guesses.length < 6) {
    allRows.push(currentGuessArray);
    allRows.push(...emptyRows);
  }

  const getLetterClass = (letter: string, rowIndex: number, colIndex: number) => {
    const baseClass = 'w-[14vw] h-[14vw] md:w-14 md:h-14 border-2 flex items-center justify-center text-lg md:text-2xl font-bold rounded transition-all duration-300';
    
    if (rowIndex >= guesses.length) {
      return letter 
        ? `${baseClass} border-gray-400 text-gray-700 scale-100`
        : `${baseClass} border-gray-300 scale-95`;
    }

    const guess = guesses[rowIndex];
    
    // First pass: mark exact matches
    const exactMatches = new Set();
    for (let i = 0; i < word.length; i++) {
      if (guess[i].toLowerCase() === word[i]) {
        exactMatches.add(i);
      }
    }

    // If this is an exact match, return green
    if (letter === word[colIndex]) {
      return `${baseClass} bg-green-500 border-green-500 text-white`;
    }

    // Count remaining available letters after exact matches
    const letterCount = {};
    for (let i = 0; i < word.length; i++) {
      if (!exactMatches.has(i)) {
        letterCount[word[i]] = (letterCount[word[i]] || 0) + 1;
      }
    }

    // Check if this letter can be yellow
    if (word.includes(letter) && !exactMatches.has(colIndex)) {
      // Count how many of this letter we've used before this position
      let usedCount = 0;
      for (let i = 0; i < colIndex; i++) {
        if (guess[i].toLowerCase() === letter && !exactMatches.has(i) && word.includes(letter)) {
          usedCount++;
        }
      }

      // If we haven't used up all instances of this letter, show yellow
      if (usedCount < (letterCount[letter] || 0)) {
        return `${baseClass} bg-yellow-500 border-yellow-500 text-white`;
      }
    }
    
    return `${baseClass} bg-gray-600 border-gray-600 text-white`;
};

  return (
    <div className="grid grid-rows-6 gap-1 mx-auto w-fit">
      {allRows.map((row, rowIndex) => (
        <div key={rowIndex} className="grid grid-cols-5 gap-1">
          {row.map((letter, colIndex) => (
            <div
              key={colIndex}
              className={getLetterClass(letter.toLowerCase(), rowIndex, colIndex)}
            >
              {letter.toUpperCase()}  {/* Display uppercase */}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Grid;