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

    if (letter === word[colIndex]) {
      return `${baseClass} bg-green-500 border-green-500 text-white`;
    }
    
    if (word.includes(letter)) {
      return `${baseClass} bg-yellow-500 border-yellow-500 text-white`;
    }
    
    return `${baseClass} bg-gray-600 border-gray-600 text-white`;
  };

  return (
    <div className="grid gap-1 sm:gap-2 mb-4 max-w-sm mx-auto">
      {allRows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-1 sm:gap-2 justify-center">
          {row.map((letter, colIndex) => (
            <div
              key={colIndex}
              className={getLetterClass(letter, rowIndex, colIndex)}
            >
              {letter}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Grid;