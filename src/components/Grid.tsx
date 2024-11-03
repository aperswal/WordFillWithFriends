import React from 'react';

interface GridProps {
  word: string;
  guesses: string[];
  currentGuess: string;
}

const Grid: React.FC<GridProps> = ({ word, guesses, currentGuess }) => {
  console.log('Grid rendering:', { word, guesses, currentGuess });
  
  // Calculate remaining empty rows needed
  const remainingRows = Math.max(0, 6 - (guesses.length + 1));
  
  // Create arrays for each row type
  const guessRows = guesses.map(g => g.split(''));
  const currentGuessArray = currentGuess ? currentGuess.split('').concat(Array(5 - currentGuess.length).fill('')) : Array(5).fill('');
  const emptyRows = Array(remainingRows).fill(Array(5).fill(''));
  
  // Combine all rows
  const allRows = [...guessRows];
  if (guesses.length < 6) {
    allRows.push(currentGuessArray);
    allRows.push(...emptyRows);
  }

  console.log('Grid computed rows:', allRows);
  
  // Rest of the component remains the same...
  const getLetterClass = (letter: string, rowIndex: number, colIndex: number) => {
    const baseClass = 'w-14 h-14 border-2 flex items-center justify-center text-2xl font-bold rounded transition-all duration-300';
    
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
    <div className="grid gap-1 mb-4">
      {allRows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-1 justify-center">
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