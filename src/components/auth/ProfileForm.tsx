import { useState, type FormEvent } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const SKIN_COLORS = ['#FFE0BD', '#F1C27D', '#C68642', '#8D5524', '#6B4423'];
const HAIR_STYLES = ['short', 'long', 'spiky', 'bald', 'curly'];
const HAIR_COLORS = ['#000000', '#8B4513', '#FFD700', '#FF6347', '#4B0082'];

export function ProfileForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [username, setUsername] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [skinColor, setSkinColor] = useState(SKIN_COLORS[0]);
  const [hairStyle, setHairStyle] = useState(HAIR_STYLES[0]);
  const [hairColor, setHairColor] = useState(HAIR_COLORS[0]);

  const createUserProfile = useMutation(api.users.createUserProfile);
  const checkUsername = useQuery(api.users.checkUsername,
    username ? { username } : "skip"
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate username
    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (checkUsername && !checkUsername.available) {
      setError('Username is already taken');
      return;
    }

    setLoading(true);

    try {
      await createUserProfile({
        username,
        gender,
        avatarConfig: {
          skinColor,
          hairStyle,
          hairColor,
        },
      });
      // Profile created successfully - Convex will automatically update the UI via reactive queries
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Profile creation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profile Section */}
          <div>
            <Input
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="CoolPlayer123"
              minLength={3}
              error={
                checkUsername && !checkUsername.available
                  ? 'Username taken'
                  : undefined
              }
            />

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender
              </label>
              <div className="flex gap-2">
                {(['male', 'female', 'other'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`px-4 py-2 rounded-lg border-2 transition-colors capitalize ${
                      gender === g
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Avatar Preview */}
          <div className="flex flex-col items-center">
            <div className="mb-4">
              <div
                className="w-32 h-32 rounded-full border-4 border-gray-300 flex items-center justify-center text-4xl"
                style={{ backgroundColor: skinColor }}
              >
                <div style={{ color: hairColor }}>
                  {hairStyle === 'bald' ? '👨' : '👨‍🦱'}
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 text-center">
              Welcome, <strong>{username || 'Player'}</strong>!<br />
              You'll start with <strong>10 PattyCoins</strong> and <strong>3 starter cards</strong>
            </p>
          </div>
        </div>

        {/* Avatar Customization */}
        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Skin Color
            </label>
            <div className="flex gap-2">
              {SKIN_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSkinColor(color)}
                  className={`w-10 h-10 rounded-full border-2 transition-all ${
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
            <div className="flex gap-2">
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
            <div className="flex gap-2">
              {HAIR_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setHairColor(color)}
                  className={`w-10 h-10 rounded-full border-2 transition-all ${
                    hairColor === color ? 'border-blue-500 scale-110' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading || (checkUsername && !checkUsername.available)}
          className="w-full mt-6"
        >
          {loading ? 'Creating Character...' : 'Start Playing!'}
        </Button>
      </form>
    </div>
  );
}
