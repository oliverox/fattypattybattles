import { useState, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Button } from './Button';
import { AvatarPreview } from '../auth/AvatarPreview';

const SKIN_COLORS = [
  '#FFECD4', '#FFE0BD', '#FFD5B8', '#F1C27D', '#E0AC69',
  '#C68642', '#8D5524', '#6B4423', '#5C4033', '#3B2F2F',
];
const HAIR_STYLES = ['short', 'long', 'spiky', 'bald', 'curly'];
const HAIR_COLORS = [
  '#000000', '#1C1C1C', '#3D2314', '#8B4513', '#A0522D',
  '#D2691E', '#FFD700', '#F4A460', '#FF6347', '#DC143C',
  '#FF69B4', '#4B0082', '#6A5ACD', '#00CED1', '#32CD32',
];

interface EditAvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig?: {
    skinColor: string;
    hairStyle: string;
    hairColor: string;
  };
}

export function EditAvatarModal({ isOpen, onClose, currentConfig }: EditAvatarModalProps) {
  const [skinColor, setSkinColor] = useState(currentConfig?.skinColor ?? SKIN_COLORS[0]);
  const [hairStyle, setHairStyle] = useState(currentConfig?.hairStyle ?? HAIR_STYLES[0]);
  const [hairColor, setHairColor] = useState(currentConfig?.hairColor ?? HAIR_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateAvatarConfig = useMutation(api.users.updateAvatarConfig);

  // Sync state when currentConfig changes or modal opens
  useEffect(() => {
    if (isOpen && currentConfig) {
      setSkinColor(currentConfig.skinColor);
      setHairStyle(currentConfig.hairStyle);
      setHairColor(currentConfig.hairColor);
      setError('');
    }
  }, [isOpen, currentConfig]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      await updateAvatarConfig({
        avatarConfig: {
          skinColor,
          hairStyle,
          hairColor,
        },
      });
      onClose();
    } catch (err) {
      console.error('Failed to update avatar:', err);
      setError(err instanceof Error ? err.message : 'Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-center text-blue-600 mb-4">
          Edit Avatar
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        {/* Avatar Preview */}
        <div className="flex justify-center mb-6">
          <AvatarPreview
            skinColor={skinColor}
            hairStyle={hairStyle}
            hairColor={hairColor}
          />
        </div>

        {/* Customization Options */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Skin Color
            </label>
            <div className="flex flex-wrap gap-2">
              {SKIN_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSkinColor(color)}
                  className={`w-9 h-9 rounded-full border-2 transition-all ${
                    skinColor === color ? 'border-blue-500 scale-110' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hair Style
            </label>
            <div className="flex flex-wrap gap-2">
              {HAIR_STYLES.map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setHairStyle(style)}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors capitalize ${
                    hairStyle === style
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hair Color
            </label>
            <div className="flex flex-wrap gap-2">
              {HAIR_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setHairColor(color)}
                  className={`w-9 h-9 rounded-full border-2 transition-all ${
                    hairColor === color ? 'border-blue-500 scale-110' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-6">
          <Button
            onClick={onClose}
            className="flex-1 bg-gray-500 hover:bg-gray-600"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}
