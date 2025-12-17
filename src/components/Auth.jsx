import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const isSupabaseConfigured = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;

function Auth({ onAuthChange }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if Supabase is configured
    if (!isSupabaseConfigured) {
      return;
    }

    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (onAuthChange) onAuthChange(session?.user ?? null);
    }).catch((error) => {
      console.error('Error getting session:', error);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (onAuthChange) onAuthChange(session?.user ?? null);
    });

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, [onAuthChange]);

  const handleAuth = async (e) => {
    e.preventDefault();
    
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured. Please set up your environment variables.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        // Show success message
        alert('Sign up successful! Please check your email to verify your account.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-lg px-4 py-2">
        <span className="text-white/60 text-xs">
          Auth disabled (Supabase not configured)
        </span>
      </div>
    );
  }

  if (user) {
    return (
      <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-lg px-4 py-2 flex items-center gap-3">
        <span className="text-white text-sm">
          {user.email}
        </span>
        <button
          onClick={handleSignOut}
          className="backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 rounded px-3 py-1 text-white text-sm font-semibold transition-all duration-300"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-6 max-w-md">
      <h2 className="text-white text-2xl font-bold mb-4 text-center">
        {isSignUp ? 'Sign Up' : 'Sign In'}
      </h2>
      <form onSubmit={handleAuth} className="space-y-4">
        <div>
          <label className="block text-white/80 mb-2 text-sm">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-3 text-white placeholder-white/40 outline-none focus:border-white/40 transition-colors"
            placeholder="your@email.com"
          />
        </div>
        <div>
          <label className="block text-white/80 mb-2 text-sm">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-3 text-white placeholder-white/40 outline-none focus:border-white/40 transition-colors"
            placeholder="••••••••"
          />
        </div>
        {error && (
          <div className="text-red-300 text-sm bg-red-500/20 border border-red-500/50 rounded-lg p-3">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full backdrop-blur-md bg-white/20 hover:bg-white/30 border border-white/30 rounded-xl p-3 text-white font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
        </button>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-white/20"></div>
          <span className="text-white/60 text-xs">OR</span>
          <div className="flex-1 h-px bg-white/20"></div>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError(null);
            setEmail('');
            setPassword('');
          }}
          className="w-full backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl p-3 text-white font-semibold transition-all duration-300"
        >
          {isSignUp ? 'Switch to Sign In' : 'Switch to Sign Up'}
        </button>
      </form>
    </div>
  );
}

export default Auth;

