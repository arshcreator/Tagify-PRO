import { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { AnimatedButton } from '../components/ui/animated-button';

export function Auth() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError('');
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#050505] p-4">
      <div className="w-full max-w-md bg-white/5 border border-white/10 p-8 rounded-2xl backdrop-blur-xl">
        <div className="flex flex-col items-center gap-4 mb-10">
          <div className="size-12 bg-white rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-black text-2xl">filter_vintage</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-[0.2em] uppercase text-center">Tagify Pro</h1>
          <p className="text-white/40 text-[11px] font-medium tracking-widest uppercase text-center">
            AI-Powered Asset Tagging
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center flex flex-col gap-2">
            <span>{error}</span>
            {error.includes('auth/unauthorized-domain') && (
              <span className="text-xs text-red-400/80">
                This app URL needs to be added to your Firebase Console under Authentication &gt; Settings &gt; Authorized Domains.
              </span>
            )}
          </div>
        )}

        <AnimatedButton
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full px-6 py-4 text-[11px] tracking-widest uppercase"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          {isLoading ? 'Signing in...' : 'Continue with Google'}
        </AnimatedButton>

        <p className="mt-8 text-center text-[10px] text-white/30 uppercase tracking-widest">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
