import React, { useState, useEffect } from 'react';
import { Home, Search, Library, PlusSquare, Heart, AudioLines, LogOut, User, Globe, X, Music, DownloadCloud, History as HistoryIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { t, languageNames } from '../utils/i18n';

const Sidebar = ({ currentUser, onLogout, lang, setLang }) => {
  const location = useLocation();
  const [playlists, setPlaylists] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showLangPicker, setShowLangPicker] = useState(false);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('torofy_playlists')) || [];
    setPlaylists(stored);
  }, []);

  const createPlaylist = () => {
    if (newPlaylistName.trim()) {
      const newPlaylist = { id: Date.now().toString(), name: newPlaylistName.trim(), tracks: [] };
      const updated = [...playlists, newPlaylist];
      setPlaylists(updated);
      localStorage.setItem('torofy_playlists', JSON.stringify(updated));
      setNewPlaylistName('');
      setShowCreateModal(false);
    }
  };

  const deletePlaylist = (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Delete this playlist?')) {
      const updated = playlists.filter(p => p.id !== id);
      setPlaylists(updated);
      localStorage.setItem('torofy_playlists', JSON.stringify(updated));
    }
  };

  const navItems = [
    { name: t('home', lang), icon: <Home size={24} />, path: '/' },
    { name: t('search', lang), icon: <Search size={24} />, path: '/search' },
    { name: 'Downloads', icon: <DownloadCloud size={24} />, path: '/downloads' },
    { name: 'History', icon: <HistoryIcon size={24} />, path: '/history' },
  ];

  return (
    <>
      <div className="sidebar-container" style={{ width: '240px', backgroundColor: 'var(--bg-base)', padding: '24px 12px', display: 'flex', flexDirection: 'column' }}>
        <div className="logo-header" style={{ padding: '0 12px 24px' }}>
          <h1 style={{ color: 'var(--text-base)', fontSize: '24px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '12px', letterSpacing: '-0.04em' }}>
            <div style={{ position: 'relative', width: '36px', height: '36px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ position: 'absolute', width: '100%', height: '100%', backgroundColor: 'var(--text-bright-accent)', borderRadius: '8px', transform: 'rotate(45deg)', boxShadow: '0 0 20px rgba(30, 215, 96, 0.4)' }}></div>
              <AudioLines size={20} color="#000" style={{ position: 'relative', zIndex: 1, transform: 'rotate(-45deg)' }} />
            </div>
            TOROFY
          </h1>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '8px 12px',
                textDecoration: 'none',
                color: location.pathname === item.path ? 'var(--text-base)' : 'var(--text-subdued)',
                fontWeight: '600',
                transition: 'color 0.2s',
                borderRadius: '4px',
              }}
            >
              {item.icon}
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="extra-actions" style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #282828' }}>
          <div onClick={() => setShowCreateModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '8px 12px', color: 'var(--text-subdued)', fontWeight: '600', cursor: 'pointer', transition: 'color 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-base)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-subdued)'}
          >
            <PlusSquare size={24} /> {t('createPlaylist', lang)}
          </div>
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '4px', padding: '0 12px', maxHeight: '160px', overflowY: 'auto' }}>
            {playlists.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Link to={`/playlist/${p.id}`} style={{ flex: 1, color: 'var(--text-subdued)', textDecoration: 'none', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', padding: '4px 0', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-base)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-subdued)'}
                >
                  {p.name}
                </Link>
                <button onClick={(e) => deletePlaylist(p.id, e)} style={{ background: 'none', border: 'none', color: 'var(--text-subdued)', cursor: 'pointer', padding: '2px', fontSize: '14px', lineHeight: 1, opacity: 0.5, transition: 'opacity 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#ff4d4d'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.5'; e.currentTarget.style.color = 'var(--text-subdued)'; }}
                >×</button>
              </div>
            ))}
          </div>
        </div>
        <Link to="/liked" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '8px 12px', color: location.pathname === '/liked' ? 'var(--text-base)' : 'var(--text-subdued)', fontWeight: '600', textDecoration: 'none', transition: 'color 0.2s' }}>
          <Heart size={24} /> {t('likedSongs', lang)}
        </Link>

        {/* Bottom section */}
        <div style={{ marginTop: 'auto', padding: '16px 12px 0', borderTop: '1px solid #282828', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Language Selector */}
          <div style={{ position: 'relative' }}>
            <div
              onClick={() => setShowLangPicker(!showLangPicker)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-subdued)', fontSize: '12px', padding: '4px 0', transition: 'color 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-base)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-subdued)'}
            >
              <Globe size={14} />
              <span>{languageNames[lang]}</span>
            </div>
            {showLangPicker && (
              <div style={{
                position: 'absolute',
                bottom: '24px',
                left: 0,
                backgroundColor: '#282828',
                borderRadius: '8px',
                padding: '8px 0',
                boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
                zIndex: 1000,
                minWidth: '140px'
              }}>
                {Object.entries(languageNames).map(([code, name]) => (
                  <div
                    key={code}
                    onClick={() => { setLang(code); setShowLangPicker(false); }}
                    style={{
                      padding: '8px 16px',
                      cursor: 'pointer',
                      color: lang === code ? '#1ed760' : 'var(--text-base)',
                      fontSize: '14px',
                      fontWeight: lang === code ? '700' : '400',
                      transition: 'background-color 0.15s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User Profile */}
          {currentUser && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', marginBottom: '4px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#1ed760', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                <User size={14} color="#000" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-base)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser.username || currentUser.email}</div>
              </div>
              <div 
                onClick={onLogout} 
                title={t('logOut', lang)}
                style={{ cursor: 'pointer', color: 'var(--text-subdued)', transition: 'color 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#ff4d4d'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-subdued)'}
              >
                <LogOut size={16} />
              </div>
            </div>
          )}

          {/* Credits */}
          <a href="https://www.instagram.com/chiheb_elouni/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-subdued)', textDecoration: 'none', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-bright-accent)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-subdued)'}>
            {t('madeWith', lang)} <Heart size={12} fill="#1ed760" color="#1ed760" /> {t('by', lang)} Chiheb Elouni
          </a>
        </div>
      </div>

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }}
        onClick={() => setShowCreateModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#282828',
              borderRadius: '12px',
              padding: '32px',
              width: '100%',
              maxWidth: '400px',
              boxShadow: '0 16px 48px rgba(0,0,0,0.5)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-base)' }}>{t('createPlaylist', lang)}</h2>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-subdued)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <div style={{ width: '80px', height: '80px', backgroundColor: '#3e3e3e', borderRadius: '4px', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                <Music size={32} color="var(--text-subdued)" />
              </div>
              <input
                type="text"
                placeholder={t('enterPlaylistName', lang)}
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createPlaylist()}
                autoFocus
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: '4px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  color: 'white',
                  fontSize: '16px',
                  outline: 'none'
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={() => setShowCreateModal(false)}
                style={{ padding: '10px 24px', borderRadius: '500px', border: 'none', backgroundColor: 'transparent', color: 'var(--text-base)', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}
              >
                Cancel
              </button>
              <button 
                onClick={createPlaylist}
                disabled={!newPlaylistName.trim()}
                style={{ 
                  padding: '10px 32px', 
                  borderRadius: '500px', 
                  border: 'none', 
                  backgroundColor: newPlaylistName.trim() ? '#1ed760' : '#535353', 
                  color: newPlaylistName.trim() ? '#000' : '#a7a7a7', 
                  fontWeight: '700', 
                  cursor: newPlaylistName.trim() ? 'pointer' : 'default', 
                  fontSize: '14px',
                  transition: 'all 0.2s'
                }}
              >
                {t('createPlaylist', lang)}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
