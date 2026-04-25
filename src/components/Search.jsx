import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search as SearchIcon, Play, Heart, Download, PlusSquare, Check, Loader } from 'lucide-react';
import { Link } from 'react-router-dom';
import { downloadTrack } from '../utils/offlineCache';
import { t } from '../utils/i18n';
import { API_URL } from '../utils/config';

const Search = ({ playTrack, lang }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [likedTracks, setLikedTracks] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [downloading, setDownloading] = useState({});

  const downloadToLibrary = async (track, e) => {
    e.stopPropagation();
    const trackId = track.trackId;
    if (downloading[trackId]) return;
    setDownloading(prev => ({ ...prev, [trackId]: 'loading' }));
    try {
      await downloadTrack(track);
      setDownloading(prev => ({ ...prev, [trackId]: 'done' }));
      setTimeout(() => setDownloading(prev => { const n = {...prev}; delete n[trackId]; return n; }), 2000);
    } catch (err) {
      console.error('Download failed:', err);
      setDownloading(prev => { const n = {...prev}; delete n[trackId]; return n; });
      alert('Download failed. Please try again.');
    }
  };

  const addToPlaylist = (track, e) => {
    e.stopPropagation();
    const playlists = JSON.parse(localStorage.getItem('torofy_playlists')) || [];
    if (playlists.length === 0) {
      alert("You don't have any playlists yet! Create one in the sidebar first.");
      return;
    }
    
    // Simple native prompt to choose playlist index
    let promptMsg = "Enter the number of the playlist to add this song to:\n";
    playlists.forEach((p, i) => {
      promptMsg += `${i + 1}. ${p.name}\n`;
    });
    
    const choice = window.prompt(promptMsg);
    const index = parseInt(choice) - 1;
    
    if (!isNaN(index) && playlists[index]) {
      // Check if already in playlist
      if (!playlists[index].tracks.find(t => t.trackId === track.trackId)) {
        playlists[index].tracks.push(track);
        localStorage.setItem('torofy_playlists', JSON.stringify(playlists));
        alert(`Added to ${playlists[index].name}!`);
      } else {
        alert("Song is already in this playlist.");
      }
    }
  };

  useEffect(() => {
    setLikedTracks(JSON.parse(localStorage.getItem('likedSongs')) || []);
    setRecentSearches(JSON.parse(localStorage.getItem('torofy_recentSearches')) || []);
  }, []);

  const toggleLike = (track, e) => {
    e.stopPropagation();
    let currentLiked = JSON.parse(localStorage.getItem('likedSongs')) || [];
    const isLiked = currentLiked.find(t => t.trackId === track.trackId);
    if (isLiked) {
      currentLiked = currentLiked.filter(t => t.trackId !== track.trackId);
    } else {
      currentLiked.push(track);
    }
    localStorage.setItem('likedSongs', JSON.stringify(currentLiked));
    setLikedTracks(currentLiked);
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim()) {
        setLoading(true);
        axios.get(`${API_URL}/api/search?q=${encodeURIComponent(query)}`)
          .then(res => {
            if (res.data.results) {
              setResults(res.data.results);
              setChannels(res.data.channels || []);
              
              // Save to recent searches
              let recents = JSON.parse(localStorage.getItem('torofy_recentSearches')) || [];
              recents = recents.filter(q => q.toLowerCase() !== query.toLowerCase());
              recents.unshift(query);
              if (recents.length > 8) recents.pop();
              localStorage.setItem('torofy_recentSearches', JSON.stringify(recents));
              setRecentSearches(recents);
            }
            setLoading(false);
          })
          .catch(err => {
            console.error(err);
            setLoading(false);
          });
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  return (
    <div style={{ padding: isMobile ? '16px' : '24px', color: 'var(--text-base)', paddingBottom: isMobile ? '160px' : '120px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#242424', padding: '12px 16px', borderRadius: '500px', width: '100%', maxWidth: isMobile ? '100%' : '360px', marginBottom: isMobile ? '20px' : '32px' }}>
        <SearchIcon size={20} color="var(--text-subdued)" />
        <input 
          type="text" 
          placeholder={t('whatToListen', lang)} 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ 
            backgroundColor: 'transparent', 
            border: 'none', 
            color: 'var(--text-base)', 
            fontSize: '14px',
            width: '100%',
            outline: 'none'
          }}
        />
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-subdued)' }}>{t('searching', lang)}</div>
      ) : results.length > 0 ? (
        <div>
          {channels.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '700', marginBottom: '12px' }}>{t('topResult', lang)}</h2>
              <Link to={`/artist/${encodeURIComponent(channels[0].name)}`} style={{ textDecoration: 'none' }}>
                <div style={{ 
                  backgroundColor: '#181818', 
                  padding: isMobile ? '16px' : '20px', 
                  borderRadius: '8px', 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: '16px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  maxWidth: '100%'
                }}
                >
                  <img src={channels[0].image} alt={channels[0].name} style={{ width: isMobile ? '56px' : '92px', height: isMobile ? '56px' : '92px', borderRadius: '50%', objectFit: 'cover', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <h1 style={{ fontSize: isMobile ? '20px' : '32px', fontWeight: '700', color: 'var(--text-base)', margin: '0 0 4px 0', letterSpacing: '-0.04em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{channels[0].name}</h1>
                    <span style={{ color: 'var(--text-subdued)', fontSize: '14px', backgroundColor: 'rgba(0,0,0,0.2)', padding: '4px 12px', borderRadius: '500px' }}>{t('artist', lang)}</span>
                  </div>
                </div>
              </Link>
            </div>
          )}
          <h3 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '700', marginBottom: '12px' }}>{t('songs', lang)}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {results.map((track, index) => (
              <div 
                key={track.trackId}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: isMobile ? '8px 8px' : '8px 16px', 
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                  gap: isMobile ? '10px' : '0'
                }}
                onClick={() => playTrack(track, results)}
              >
                {/* Track number / play icon */}
                {!isMobile && (
                  <div style={{ width: '32px', color: 'var(--text-subdued)', textAlign: 'right', marginRight: '16px', flexShrink: 0 }}>
                    {index + 1}
                  </div>
                )}
                
                {/* Artwork */}
                <img src={track.artworkUrl100} alt={track.trackName} style={{ width: isMobile ? '44px' : '48px', height: isMobile ? '44px' : '48px', borderRadius: '4px', objectFit: 'cover', flexShrink: 0 }} />
                
                {/* Title + Artist */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: 'var(--text-base)', fontSize: isMobile ? '14px' : '16px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.trackName}</div>
                  <div style={{ color: 'var(--text-subdued)', fontSize: isMobile ? '12px' : '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {track.artistName}
                  </div>
                </div>

                {/* Actions - simplified on mobile */}
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '16px', flexShrink: 0 }}>
                  {!isMobile && (
                    <div onClick={(e) => addToPlaylist(track, e)} title="Add to Playlist">
                      <PlusSquare size={20} color="var(--text-subdued)" />
                    </div>
                  )}
                  <div onClick={(e) => toggleLike(track, e)} style={{ minWidth: '28px', minHeight: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {likedTracks.find(t => t.trackId === track.trackId) ? <Heart size={isMobile ? 18 : 20} fill="#1ed760" color="#1ed760" /> : <Heart size={isMobile ? 18 : 20} color="var(--text-subdued)" />}
                  </div>
                  <div onClick={(e) => downloadToLibrary(track, e)} style={{ cursor: downloading[track.trackId] ? 'default' : 'pointer', minWidth: '28px', minHeight: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {downloading[track.trackId] === 'loading' ? (
                      <Loader size={isMobile ? 18 : 20} color="#1ed760" style={{ animation: 'spin 1s linear infinite' }} />
                    ) : downloading[track.trackId] === 'done' ? (
                      <Check size={isMobile ? 18 : 20} color="#1ed760" />
                    ) : (
                      <Download size={isMobile ? 18 : 20} color="var(--text-subdued)" />
                    )}
                  </div>
                </div>

                {/* Album + Duration - desktop only */}
                {!isMobile && (
                  <>
                    <div style={{ color: 'var(--text-subdued)', fontSize: '14px', width: '30%', textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginLeft: '16px' }}>
                      {track.collectionName || 'YouTube Single'}
                    </div>
                    <div style={{ color: 'var(--text-subdued)', fontSize: '14px', flexShrink: 0 }}>
                      {Math.floor(track.trackTimeMillis / 60000)}:
                      {((track.trackTimeMillis % 60000) / 1000).toFixed(0).padStart(2, '0')}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : query.trim() ? (
        <div style={{ color: 'var(--text-subdued)' }}>{t('noResults', lang)} "{query}"</div>
      ) : (
        <div>
          {recentSearches.length > 0 && !query && (
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>{t('recentSearches', lang)}</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {recentSearches.map((searchItem, idx) => (
                  <div 
                    key={idx}
                    onClick={() => setQuery(searchItem)}
                    style={{ 
                      backgroundColor: 'var(--bg-elevated-highlight)', 
                      padding: '8px 16px', 
                      borderRadius: '24px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-elevated-highlight)'}
                  >
                    <SearchIcon size={16} color="var(--text-subdued)" />
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>{searchItem}</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const updated = recentSearches.filter(q => q !== searchItem);
                        setRecentSearches(updated);
                        localStorage.setItem('torofy_recentSearches', JSON.stringify(updated));
                      }}
                      style={{ background: 'none', border: 'none', color: 'var(--text-subdued)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0 4px' }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ color: 'var(--text-subdued)' }}>{t('searchPlaceholder', lang)}</div>
        </div>
      )}
    </div>
  );
};

export default Search;
