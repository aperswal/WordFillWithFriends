import React from 'react';

interface KeyboardProps {
  onKeyPress: (key: string) => void;
  usedLetters: Record<string, 'correct' | 'present' | 'absent'>;
}

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫']
];

const Keyboard: React.FC<KeyboardProps> = ({ onKeyPress, usedLetters }) => {
  const getKeyClass = (key: string) => {
    const status = usedLetters[key];
    const baseClass = 'p-2 sm:p-3 rounded font-bold text-sm sm:text-base transition-colors';
    
    if (key === 'ENTER' || key === '⌫') {
      return `${baseClass} bg-gray-300 hover:bg-gray-400 text-gray-800 flex-grow`;
    }

    switch (status) {
      case 'correct':
        return `${baseClass} bg-green-500 text-white`;
      case 'present':
        return `${baseClass} bg-yellow-500 text-white`;
      case 'absent':
        return `${baseClass} bg-gray-600 text-white`;
      default:
        return `${baseClass} bg-gray-200 hover:bg-gray-300 text-gray-800`;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-2">
      {KEYBOARD_ROWS.map((row, i) => (
        <div key={i} className="flex justify-center gap-1 mb-1">
          {row.map((key) => (
            <button
              key={key}
              onClick={() => onKeyPress(key)}
              className={getKeyClass(key)}
            >
              {key}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Keyboard;