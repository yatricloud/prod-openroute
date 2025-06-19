import React, { useState } from 'react';
import { supabase } from '../utils/supabase';

const LOGO_URL = 'https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/Logo/yatricloud-round-transparent.png';

const LoginPage: React.FC<{ onLogin: (user: any) => void }> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let result;
      if (mode === 'login') {
        result = await supabase.auth.signInWithPassword({ email, password });
      } else {
        result = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: window.location.origin
          }
        });
      }
      
      if (result.error) {
        setError(result.error.message);
      } else if (result.data.user) {
        // For signup, check if email confirmation is needed
        if (mode === 'signup' && !result.data.user.email_confirmed_at) {
          setError('Account created! Please check your email and click the confirmation link to continue.');
        } else {
          onLogin(result.data.user);
        }
      } else {
        setError('Please check your email for confirmation link.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <img src={LOGO_URL} alt="Chat Yatri Logo" className="w-20 h-20 mb-3 rounded-full shadow-lg" />
          <h1 className="text-3xl font-extrabold tracking-tight text-primary mb-1">Chat Yatri</h1>
          <p className="text-foreground/60 text-sm text-center max-w-xs">Welcome! Please sign in to continue to your AI chat experience.</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white/90 backdrop-blur border border-border p-8 rounded-xl shadow-xl w-full space-y-6">
          <h2 className="text-2xl font-bold text-center mb-2">{mode === 'login' ? 'Login' : 'Create Account'}</h2>
          {error && <div className="bg-red-100 text-red-700 p-2 rounded text-sm text-center">{error}</div>}
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full p-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
              required
              autoComplete="email"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full p-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
              required
              autoComplete="current-password"
              placeholder="Enter your password"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary-hover transition-colors font-semibold text-lg shadow"
            disabled={loading}
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Sign Up'}
          </button>
          <div className="text-center text-sm mt-2">
            {mode === 'login' ? (
              <>
                Don&apos;t have an account?{' '}
                <button type="button" className="text-primary hover:underline font-semibold" onClick={() => setMode('signup')}>
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button type="button" className="text-primary hover:underline font-semibold" onClick={() => setMode('login')}>
                  Login
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage; 