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
    const baseClass = 'min-w-[8vw] sm:min-w-[40px] h-[45px] sm:h-[50px] rounded font-bold text-sm sm:text-base transition-colors flex items-center justify-center';
    
    if (key === 'ENTER' || key === '⌫') {
      return `${baseClass} px-2 sm:px-4 bg-gray-300 hover:bg-gray-400 text-gray-800 flex-grow max-w-[65px]`;
    }
  
    const widthClass = 'w-[8vw] sm:w-[40px]';
    
    switch (status) {
      case 'correct':
        return `${baseClass} ${widthClass} bg-green-500 text-white`;
      case 'present':
        return `${baseClass} ${widthClass} bg-yellow-500 text-white`;
      case 'absent':
        return `${baseClass} ${widthClass} bg-gray-600 text-white`; // Changed back to gray-600 for absent letters
      default:
        return `${baseClass} ${widthClass} bg-gray-200 hover:bg-gray-300 text-gray-800`;
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-50 pb-4 pt-2 px-1 sm:px-4 sm:static">
      <div className="max-w-lg mx-auto space-y-1.5">
        {KEYBOARD_ROWS.map((row, i) => (
          <div key={i} className="flex justify-center gap-1.5">
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
    </div>
  );
};

export default Keyboard;