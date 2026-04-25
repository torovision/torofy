import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Player from './components/Player';
import MainContent from './components/MainContent';
import Search from './components/Search';
import ArtistProfile from './components/ArtistProfile';
import LocalLibrary from './components/LocalLibrary';
import LikedSongs from './components/LikedSongs';
import History from './components/History';
import PlaylistView from './components/PlaylistView';
import Downloads from './components/Downloads';
import OfflineDashboard from './components/OfflineDashboard';
import Auth from './components/Auth';
import { auth, logoutUser, onAuthStateChanged, syncLikedSongs, syncPlaylists, syncRecentArtists, syncRecentSearches } from './utils/firebase';
import { detectLanguage, t, languageNames } from './utils/i18n';
import { User, LogOut, Settings, X, Globe, Wifi } from 'lucide-react';
import './index.css';

function App() {
  const [loading, setLoading] = useState(true);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [lang, setLang] = useState(detectLanguage());
  const [showMobileSettings, setShowMobileSettings] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [dataSaver, setDataSaver] = useState(localStorage.getItem('torofy_dataSaver') === 'true');
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  const toggleDataSaver = () => {
    const newVal = !dataSaver;
    setDataSaver(newVal);
    localStorage.setItem('torofy_dataSaver', newVal.toString());
  };

  const changeLang = (newLang) => {
    setLang(newLang);
    localStorage.setItem('torofy_language', newLang);
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    // Listen to Firebase auth state
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const stored = JSON.parse(localStorage.getItem('torofy_currentUser'));
        if (stored && stored.uid === firebaseUser.uid) {
          setCurrentUser(stored);
        } else {
          const user = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            username: firebaseUser.displayName || firebaseUser.email.split('@')[0]
          };
          localStorage.setItem('torofy_currentUser', JSON.stringify(user));
          setCurrentUser(user);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Periodic cloud sync (every 30 seconds)
  useEffect(() => {
    if (!currentUser?.uid) return;
    const interval = setInterval(() => {
      const liked = JSON.parse(localStorage.getItem('likedSongs')) || [];
      const playlists = JSON.parse(localStorage.getItem('torofy_playlists')) || [];
      const recentArtists = JSON.parse(localStorage.getItem('torofy_recentArtists')) || [];
      const recentSearches = JSON.parse(localStorage.getItem('torofy_recentSearches')) || [];
      syncLikedSongs(currentUser.uid, liked).catch(() => {});
      syncPlaylists(currentUser.uid, playlists).catch(() => {});
      syncRecentArtists(currentUser.uid, recentArtists).catch(() => {});
      syncRecentSearches(currentUser.uid, recentSearches).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleLogout = async () => {
    // Sync one last time before logging out
    if (currentUser?.uid) {
      const liked = JSON.parse(localStorage.getItem('likedSongs')) || [];
      const playlists = JSON.parse(localStorage.getItem('torofy_playlists')) || [];
      const recentArtists = JSON.parse(localStorage.getItem('torofy_recentArtists')) || [];
      const recentSearches = JSON.parse(localStorage.getItem('torofy_recentSearches')) || [];
      await syncLikedSongs(currentUser.uid, liked).catch(() => {});
      await syncPlaylists(currentUser.uid, playlists).catch(() => {});
      await syncRecentArtists(currentUser.uid, recentArtists).catch(() => {});
      await syncRecentSearches(currentUser.uid, recentSearches).catch(() => {});
    }
    await logoutUser();
    // Clear ALL user-specific data so the next account starts fresh
    localStorage.removeItem('torofy_currentUser');
    localStorage.removeItem('likedSongs');
    localStorage.removeItem('torofy_playlists');
    localStorage.removeItem('torofy_recentArtists');
    localStorage.removeItem('torofy_recentSearches');
    setCurrentUser(null);
  };

  const playTrack = (track, contextQueue = null) => {
    if (contextQueue) {
      setQueue(contextQueue);
      const idx = contextQueue.findIndex(t => t.trackId === track.trackId);
      setQueueIndex(idx !== -1 ? idx : 0);
    } else {
      setQueue([track]);
      setQueueIndex(0);
    }
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  const playNext = (autoAdvance = false) => {
    if (queue.length > 0) {
      if (isShuffle) {
        const nextIdx = Math.floor(Math.random() * queue.length);
        setQueueIndex(nextIdx);
        setCurrentTrack({ ...queue[nextIdx], _t: Date.now() }); // Force re-render for same track
        setIsPlaying(true);
        return true;
      } else if (queueIndex < queue.length - 1) {
        const nextIdx = queueIndex + 1;
        setQueueIndex(nextIdx);
        setCurrentTrack({ ...queue[nextIdx], _t: Date.now() });
        setIsPlaying(true);
        return true;
      } else if (isRepeat && autoAdvance) {
        setQueueIndex(0);
        setCurrentTrack({ ...queue[0], _t: Date.now() });
        setIsPlaying(true);
        return true;
      }
    }
    return false;
  };

  const playPrev = () => {
    if (queueIndex > 0) {
      const prevIdx = queueIndex - 1;
      setQueueIndex(prevIdx);
      setCurrentTrack({ ...queue[prevIdx], _t: Date.now() });
      setIsPlaying(true);
    } else if (isRepeat && queue.length > 0) {
      const prevIdx = queue.length - 1;
      setQueueIndex(prevIdx);
      setCurrentTrack({ ...queue[prevIdx], _t: Date.now() });
      setIsPlaying(true);
    }
  };

  return (
    <Router>
      {loading ? (
        <div style={{ width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000' }}>
          <div style={{ color: '#1ed760', fontSize: '24px', fontWeight: '700' }}>TOROFY</div>
        </div>
      ) : !currentUser ? (
        <Auth onLogin={(user) => setCurrentUser(user)} />
      ) : (
        <div className="app-container" style={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
        
        {/* Mobile Header (Only visible on mobile) */}
        {isMobile && (
          <div style={{ height: '60px', padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-base)', zIndex: 100 }}>
            <h1 style={{ fontSize: '20px', fontWeight: '900', color: 'white', letterSpacing: '-0.04em' }}>TOROFY</h1>
            <div onClick={() => setShowMobileSettings(true)} style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#1ed760', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', boxShadow: '0 0 10px rgba(30,215,96,0.3)' }}>
               <User size={16} color="black" />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <Sidebar currentUser={currentUser} onLogout={handleLogout} lang={lang} setLang={changeLang} />
          <div className="main-content-area" style={{ flex: 1, backgroundColor: 'var(--bg-highlight)', margin: '8px 8px 0 0', borderRadius: '8px', overflowY: 'auto' }}>
            {!isOnline ? (
              <OfflineDashboard playTrack={playTrack} />
            ) : (
              <Routes>
                <Route path="/" element={<MainContent playTrack={playTrack} lang={lang} />} />
                <Route path="/search" element={<Search playTrack={playTrack} lang={lang} />} />
                <Route path="/artist/:name" element={<ArtistProfile playTrack={playTrack} lang={lang} />} />
                <Route path="/library" element={<LocalLibrary playTrack={playTrack} lang={lang} />} />
                <Route path="/liked" element={<LikedSongs playTrack={playTrack} lang={lang} />} />
                <Route path="/history" element={<History playTrack={playTrack} lang={lang} />} />
                <Route path="/downloads" element={<Downloads playTrack={playTrack} lang={lang} />} />
                <Route path="/playlist/:id" element={<PlaylistView playTrack={playTrack} lang={lang} />} />
              </Routes>
            )}
          </div>
        </div>
        <Player 
          currentTrack={currentTrack} 
          isPlaying={isPlaying} 
          setIsPlaying={setIsPlaying} 
          playNext={() => playNext(false)}
          playPrev={playPrev}
          isShuffle={isShuffle}
          setIsShuffle={setIsShuffle}
          isRepeat={isRepeat}
          setIsRepeat={setIsRepeat}
          onAutoEnded={async () => {
            const playedNext = playNext(true);
            if (!playedNext && isRepeat && queue.length === 1) {
               setCurrentTrack({ ...currentTrack, _t: Date.now() });
               setIsPlaying(true);
            } else if (!playedNext) {
               // Auto-Play Radio Feature
               if (currentTrack && currentTrack.artistName) {
                 try {
                   const res = await fetch(`http://localhost:3001/api/search?q=${encodeURIComponent(currentTrack.artistName + ' song')}`);
                   const data = await res.json();
                   if (data && data.length > 0) {
                     // Pick a random track from the top 5 results
                     const randIdx = Math.floor(Math.random() * Math.min(5, data.length));
                     const nextRadioTrack = data[randIdx];
                     setQueue([...queue, nextRadioTrack]);
                     setQueueIndex(queue.length);
                     setCurrentTrack({ ...nextRadioTrack, _t: Date.now() });
                     setIsPlaying(true);
                     return;
                   }
                 } catch (e) {
                   console.error('Auto-play fetch failed', e);
                 }
               }
               setIsPlaying(false);
            }
          }}
          queue={queue}
          setQueue={setQueue}
          queueIndex={queueIndex}
          dataSaver={dataSaver}
          playTrackFromQueue={(index) => {
            setQueueIndex(index);
            setCurrentTrack({...queue[index], _t: Date.now()});
            setIsPlaying(true);
          }}
        />

        {/* Mobile Settings Modal */}
        {isMobile && showMobileSettings && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'var(--bg-base)', zIndex: 9999,
            display: 'flex', flexDirection: 'column',
            padding: 'env(safe-area-inset-top, 24px) 24px env(safe-area-inset-bottom, 24px)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>Profile & Settings</h2>
              <button onClick={() => setShowMobileSettings(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={28} /></button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#1ed760', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <User size={32} color="black" />
              </div>
              <div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'white' }}>{currentUser.username || currentUser.email}</div>
                <div style={{ color: 'var(--text-subdued)', fontSize: '14px' }}>Premium Member</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div onClick={toggleDataSaver} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', fontSize: '18px', fontWeight: '500', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <Wifi size={24} color={dataSaver ? '#1ed760' : 'white'} /> Data Saver
                </div>
                <div style={{ width: '48px', height: '24px', backgroundColor: dataSaver ? '#1ed760' : '#444', borderRadius: '12px', position: 'relative', transition: 'background-color 0.3s' }}>
                  <div style={{ position: 'absolute', top: '2px', left: dataSaver ? '26px' : '2px', width: '20px', height: '20px', backgroundColor: 'white', borderRadius: '50%', transition: 'left 0.3s' }} />
                </div>
              </div>

              <div onClick={() => setShowLangPicker(!showLangPicker)} style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'white', fontSize: '18px', fontWeight: '500', cursor: 'pointer' }}>
                <Globe size={24} /> {t('language', lang) || 'Language'}: {languageNames[lang]}
              </div>
              
              {showLangPicker && (
                <div style={{ backgroundColor: '#282828', borderRadius: '8px', padding: '8px', marginTop: '-12px' }}>
                  {Object.entries(languageNames).map(([code, name]) => (
                    <div
                      key={code}
                      onClick={() => { changeLang(code); setShowLangPicker(false); }}
                      style={{ padding: '12px 16px', color: lang === code ? '#1ed760' : 'white', fontSize: '16px', fontWeight: lang === code ? 'bold' : 'normal' }}
                    >
                      {name}
                    </div>
                  ))}
                </div>
              )}

              <div onClick={() => { handleLogout(); setShowMobileSettings(false); }} style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#ff4d4d', fontSize: '18px', fontWeight: '500', cursor: 'pointer', marginTop: 'auto' }}>
                <LogOut size={24} /> {t('logOut', lang) || 'Log Out'}
              </div>
            </div>
          </div>
        )}
      </div>
      )}
    </Router>
  );
}

export default App;
