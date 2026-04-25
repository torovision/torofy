import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { registerUser, loginUser, loginWithGoogle, initUserData, getUserData } from '../utils/firebase';
import { t, detectLanguage } from '../utils/i18n';

const Auth = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [bgImages, setBgImages] = useState([]);
  const lang = detectLanguage();

  useEffect(() => {
    // Fetch random pop albums for the background
    axios.get('https://itunes.apple.com/search?term=pop&limit=100&entity=album')
      .then(res => {
        if (res.data.results) {
          const images = res.data.results.map(a => a.artworkUrl100.replace('100x100', '300x300'));
          // Duplicate array to ensure smooth infinite scrolling
          setBgImages([...images, ...images, ...images]);
        }
      })
      .catch(console.error);
  }, []);

  const handleFirebaseLogin = async (firebaseUser, displayName) => {
    // Initialize user doc in Firestore if first time
    await initUserData(firebaseUser.uid, displayName || firebaseUser.email);
    
    // Fetch cloud data and load into localStorage (always overwrite to prevent data leaking between accounts)
    const cloudData = await getUserData(firebaseUser.uid);
    localStorage.setItem('likedSongs', JSON.stringify(cloudData?.likedSongs || []));
    localStorage.setItem('torofy_playlists', JSON.stringify(cloudData?.playlists || []));
    localStorage.setItem('torofy_recentArtists', JSON.stringify(cloudData?.recentArtists || []));
    localStorage.setItem('torofy_recentSearches', JSON.stringify(cloudData?.recentSearches || []));
    
    const user = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      username: displayName || firebaseUser.displayName || firebaseUser.email.split('@')[0]
    };
    localStorage.setItem('torofy_currentUser', JSON.stringify(user));
    onLogin(user);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password || (!isLogin && !username)) {
      setError(t('fillAllFields', lang));
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const cred = await loginUser(email, password);
        await handleFirebaseLogin(cred.user);
      } else {
        const cred = await registerUser(email, password);
        await handleFirebaseLogin(cred.user, username);
      }
    } catch (err) {
      const code = err.code;
      if (code === 'auth/email-already-in-use') setError(t('emailExists', lang));
      else if (code === 'auth/wrong-password' || code === 'auth/user-not-found' || code === 'auth/invalid-credential') setError(t('invalidCredentials', lang));
      else if (code === 'auth/weak-password') setError(t('weakPassword', lang));
      else if (code === 'auth/invalid-email') setError(t('invalidEmail', lang));
      else setError(err.message);
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const cred = await loginWithGoogle();
      await handleFirebaseLogin(cred.user, cred.user.displayName);
    } catch (err) {
      console.error('Google sign-in error:', err.code, err.message);
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        // User closed the popup, not an error
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized. Add it in Firebase Console → Authentication → Settings → Authorized domains.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Google sign-in is not enabled. Enable it in Firebase Console → Authentication → Sign-in method → Google.');
      } else {
        setError(`${t('googleFailed', lang)} (${err.code || err.message})`);
      }
    }
    setLoading(false);
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #000000 0%, #121212 50%, #1a1a1a 100%)',
      color: 'white',
      fontFamily: 'Inter, sans-serif',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div className="auth-background">
        {bgImages.map((src, i) => (
          <img key={i} src={src} alt="Album Cover" />
        ))}
      </div>

      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(30px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '48px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        zIndex: 10
      }}>
        <div style={{ position: 'relative', width: '56px', height: '56px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ position: 'absolute', width: '100%', height: '100%', backgroundColor: 'var(--text-bright-accent)', borderRadius: '12px', transform: 'rotate(45deg)', boxShadow: '0 0 30px rgba(30, 215, 96, 0.4)' }}></div>
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'relative', zIndex: 1, transform: 'rotate(-45deg)' }}>
            <path d="M2 10v3"></path>
            <path d="M6 6v11"></path>
            <path d="M10 3v18"></path>
            <path d="M14 8v7"></path>
            <path d="M18 5v13"></path>
            <path d="M22 10v3"></path>
          </svg>
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '32px', letterSpacing: '-0.02em' }}>TOROFY</h1>

        {error && (
          <div style={{ width: '100%', padding: '12px', backgroundColor: 'rgba(255, 0, 0, 0.2)', color: '#ff4d4d', borderRadius: '4px', marginBottom: '16px', fontSize: '14px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!isLogin && (
            <input 
              type="text" 
              placeholder={t('username', lang)} 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'white', fontSize: '16px', boxSizing: 'border-box' }}
            />
          )}
          <input 
            type="email" 
            placeholder={t('email', lang)} 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: '12px 16px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'white', fontSize: '16px', boxSizing: 'border-box' }}
          />
          <input 
            type="password" 
            placeholder={t('password', lang)} 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '12px 16px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'white', fontSize: '16px', boxSizing: 'border-box' }}
          />
          <button 
            type="submit" 
            disabled={loading}
            style={{ width: '100%', padding: '14px', borderRadius: '500px', border: 'none', backgroundColor: 'var(--text-bright-accent)', color: 'black', fontSize: '16px', fontWeight: 'bold', cursor: loading ? 'wait' : 'pointer', marginTop: '8px', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? t('pleaseWait', lang) : isLogin ? t('logIn', lang) : t('signUp', lang)}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%', margin: '24px 0' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
          <span style={{ color: 'var(--text-subdued)', fontSize: '14px' }}>{t('or', lang)}</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
        </div>

        {/* Google Sign In */}
        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '500px',
            border: '1px solid rgba(255,255,255,0.3)',
            backgroundColor: 'transparent',
            color: 'white',
            fontSize: '15px',
            fontWeight: '600',
            cursor: loading ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {t('continueWithGoogle', lang)}
        </button>

        <div style={{ marginTop: '24px', width: '100%', textAlign: 'center', fontSize: '14px', color: 'var(--text-subdued)' }}>
          {isLogin ? t('dontHaveAccount', lang) : t('alreadyHaveAccount', lang)}
          <span 
            onClick={() => { setIsLogin(!isLogin); setError(''); }} 
            style={{ color: 'white', fontWeight: 'bold', marginLeft: '8px', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isLogin ? t('signUpForTorofy', lang) : t('logInHere', lang)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Auth;
