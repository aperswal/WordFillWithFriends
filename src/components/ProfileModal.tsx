import React, { useState } from 'react';
import { 
  User, X, Smile, Heart, Star, Sun, Moon, Cloud,
  Zap, Flame, Droplet, Leaf, Bird, Cat,
  Dog, Fish, Flower, Mountain, Waves, Rainbow, 
  Music, Book, GamepadIcon, Crown, Diamond
} from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import type { User as UserType } from '../types';
import { signOut } from 'firebase/auth';

interface ProfileModalProps {
  onClose: () => void;
  currentUser: UserType;
}

const ICONS = [
  { icon: Smile, name: 'Smile' },
  { icon: Heart, name: 'Heart' },
  { icon: Star, name: 'Star' },
  { icon: Sun, name: 'Sun' },
  { icon: Moon, name: 'Moon' },
  { icon: Cloud, name: 'Cloud' },
  { icon: Zap, name: 'Lightning' },
  { icon: Flame, name: 'Fire' },
  { icon: Droplet, name: 'Water' },
  { icon: Leaf, name: 'Leaf' },
  { icon: Bird, name: 'Bird' },
  { icon: Cat, name: 'Cat' },
  { icon: Dog, name: 'Dog' },
  { icon: Fish, name: 'Fish' },
  { icon: Flower, name: 'Flower' },
  { icon: Mountain, name: 'Mountain' },
  { icon: Waves, name: 'Ocean' },
  { icon: Rainbow, name: 'Rainbow' },
  { icon: Music, name: 'Music' },
  { icon: Book, name: 'Book' },
  { icon: GamepadIcon, name: 'Game' },
  { icon: Crown, name: 'Crown' },
  { icon: Diamond, name: 'Diamond' }
];

const COLOR_OPTIONS = [
  { name: 'red', solid: 'rgb(239 68 68)' },
  { name: 'blue', solid: 'rgb(59 130 246)' },
  { name: 'green', solid: 'rgb(34 197 94)' },
  { name: 'yellow', solid: 'rgb(234 179 8)' },
  { name: 'purple', solid: 'rgb(168 85 247)' },
  { name: 'pink', solid: 'rgb(236 72 153)' },
  { name: 'orange', solid: 'rgb(249 115 22)' },
  { name: 'cyan', solid: 'rgb(6 182 212)' },
  { name: 'indigo', solid: 'rgb(99 102 241)' },
  { name: 'teal', solid: 'rgb(20 184 166)' },
  { name: 'emerald', solid: 'rgb(16 185 129)' },
  { name: 'violet', solid: 'rgb(139 92 246)' },
  { name: 'fuchsia', solid: 'rgb(232 121 249)' },
  { name: 'rose', solid: 'rgb(244 63 94)' }
];

const BACKGROUND_OPTIONS = Array.from({ length: 30 }, (_, i) => i + 1);

const ProfileModal: React.FC<ProfileModalProps> = ({ onClose, currentUser }) => {
  const [username, setUsername] = useState(currentUser?.username || '');
  const [selectedIcon, setSelectedIcon] = useState(currentUser?.iconId || 1);
  const [selectedIconColor, setSelectedIconColor] = useState(currentUser?.iconColor || COLOR_OPTIONS[0].solid);
  const [selectedBackground, setSelectedBackground] = useState(currentUser?.backgroundId || 1);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      onClose();
    }
  };

  const handleSave = async () => {
    if (!username.trim()) {
      toast.error('Username is required');
      return;
    }

    if (!currentUser?.uid) {
      toast.error('User not found');
      return;
    }

    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        username,
        iconId: selectedIcon,
        iconColor: selectedIconColor,
        backgroundId: selectedBackground
      });
      toast.success('Profile updated!');
      onClose();
    } catch (err) {
      console.error('Profile update error:', err);
      toast.error('Failed to update profile');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Customize Profile</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Icon
            </label>
            <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto">
              {ICONS.map((iconData, index) => {
                const IconComponent = iconData.icon;
                return (
                  <button
                    key={index + 1}
                    onClick={() => setSelectedIcon(index + 1)}
                    className={`p-2 rounded-lg flex items-center justify-center ${
                      selectedIcon === index + 1 ? 'bg-gray-100' : 'hover:bg-gray-50'
                    }`}
                    style={{ 
                      color: selectedIcon === index + 1 ? selectedIconColor : 'currentColor'
                    }}
                  >
                    <IconComponent className="w-8 h-8" />
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Icon Color
            </label>
            <div className="grid grid-cols-7 gap-2">
              {COLOR_OPTIONS.map(({ name, solid }) => (
                <button
                  key={name}
                  onClick={() => setSelectedIconColor(solid)}
                  className={`w-8 h-8 rounded-full ${
                    selectedIconColor === solid ? 'ring-2 ring-offset-2 ring-indigo-500' : ''
                  }`}
                  style={{ backgroundColor: solid }}
                />
              ))}
            </div>
          </div>
          <button
              onClick={handleLogout}
              className="w-full mt-6 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
            >
              Log Out
          </button>
          <button
            onClick={handleSave}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;