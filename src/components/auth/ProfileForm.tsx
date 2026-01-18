import { useState, useEffect, type FormEvent } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AvatarPreview } from './AvatarPreview';

const SKIN_COLORS = [
  '#FFECD4', '#FFE0BD', '#FFD5B8', '#F1C27D', '#E0AC69',
  '#C68642', '#8D5524', '#6B4423', '#5C4033', '#3B2F2F',
] as const;
const HAIR_STYLES = ['short', 'long', 'spiky', 'bald', 'curly'] as const;
const HAIR_COLORS = [
  '#000000', '#1C1C1C', '#3D2314', '#8B4513', '#A0522D',
  '#D2691E', '#FFD700', '#F4A460', '#FF6347', '#DC143C',
  '#FF69B4', '#4B0082', '#6A5ACD', '#00CED1', '#32CD32',
] as const;
const EYE_COLORS = [
  '#1A1A1A', '#3D2314', '#4A4A4A', '#634E34', '#2E536F', '#3D671D',
  '#497665', '#1C7847', '#7F7F7F', '#00CED1', '#FF69B4', '#FFD700',
] as const;
const MOUTH_STYLES = ['smile', 'grin', 'flat', 'open', 'surprised'] as const;

const DEFAULT_SKIN_COLOR = SKIN_COLORS[0];
const DEFAULT_HAIR_STYLE = HAIR_STYLES[0];
const DEFAULT_HAIR_COLOR = HAIR_COLORS[0];
const DEFAULT_EYE_COLOR = EYE_COLORS[0];
const DEFAULT_MOUTH_STYLE = MOUTH_STYLES[0];

export function ProfileForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [username, setUsername] = useState('');
  const [hasSetInitialUsername, setHasSetInitialUsername] = useState(false);
  const [skinColor, setSkinColor] = useState<string>(DEFAULT_SKIN_COLOR);
  const [hairStyle, setHairStyle] = useState<string>(DEFAULT_HAIR_STYLE);
  const [hairColor, setHairColor] = useState<string>(DEFAULT_HAIR_COLOR);
  const [eyeColor, setEyeColor] = useState<string>(DEFAULT_EYE_COLOR);
  const [mouthStyle, setMouthStyle] = useState<string>(DEFAULT_MOUTH_STYLE);

  const createUserProfile = useMutation(api.users.createUserProfile);
  const recommendedUsername = useQuery(api.users.getRecommendedUsername);
  const checkUsername = useQuery(api.users.checkUsername,
    username ? { username } : "skip"
  );

  // Set recommended username as initial value when it loads
  useEffect(() => {
    if (recommendedUsername?.username && !hasSetInitialUsername && !username) {
      setUsername(recommendedUsername.username);
      setHasSetInitialUsername(true);
    }
  }, [recommendedUsername, hasSetInitialUsername, username]);

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
        avatarConfig: {
          skinColor,
          hairStyle,
          hairColor,
          eyeColor,
          mouthStyle,
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
        {/* Avatar Preview - Centered at top */}
        <div className="flex flex-col items-center mb-6">
          <AvatarPreview
            skinColor={skinColor}
            hairStyle={hairStyle}
            hairColor={hairColor}
            eyeColor={eyeColor}
            mouthStyle={mouthStyle}
          />
          <p className="text-sm text-gray-600 text-center mt-3">
            Welcome, <strong>{username || 'Player'}</strong>!<br />
            You'll start with <strong>10 PattyCoins</strong> and <strong>3 starter cards</strong>
          </p>
        </div>

        {/* Username */}
        <div className="mb-6">
          <Input
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            placeholder={recommendedUsername?.username ?? "Loading..."}
            minLength={3}
            error={
              checkUsername && !checkUsername.available
                ? 'Username taken'
                : undefined
            }
          />
        </div>

        {/* Avatar Customization */}
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Eye Color
            </label>
            <div className="flex flex-wrap gap-2">
              {EYE_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setEyeColor(color)}
                  className={`w-9 h-9 rounded-full border-2 transition-all ${
                    eyeColor === color ? 'border-blue-500 scale-110' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mouth Style
            </label>
            <div className="flex flex-wrap gap-2">
              {MOUTH_STYLES.map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setMouthStyle(style)}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors capitalize ${
                    mouthStyle === style
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {style}
                </button>
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
