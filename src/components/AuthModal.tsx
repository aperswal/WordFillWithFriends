import React from 'react';
import { LogIn } from 'lucide-react';
import { signInWithPopup, auth, googleProvider } from '../lib/firebase';

interface AuthModalProps {
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      onClose();
    } catch (error) {
      console.error('Auth error:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-bold mb-6">Track Your Games</h2>
        <p className="text-gray-600 mb-8">
          Sign in to track games with friends and see their results!
        </p>
        
        <button
          onClick={handleGoogleSignIn}
          className="w-full bg-white border-2 border-gray-200 text-gray-700 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-gray-50"
        >
          <img 
            src="https://www.google.com/favicon.ico" 
            alt="Google" 
            className="w-5 h-5"
          />
          Continue with Google
        </button>
      </div>
    </div>
  );
};

export default AuthModal;