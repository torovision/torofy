import React, { useState, useEffect } from 'react';
import { Play, Heart, Download, Check, Loader } from 'lucide-react';
import { Link } from 'react-router-dom';
import { downloadTrack } from '../utils/offlineCache';
import { t } from '../utils/i18n';
import { API_URL } from '../utils/config';

const LikedSongs = ({ playTrack, lang }) => {
  const [likedSongs, setLikedSongs] = useState([]);
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
    }
  };

  useEffect(() => {
    const songs = JSON.parse(localStorage.getItem('likedSongs')) || [];
    setLikedSongs(songs);
  }, []);

  const toggleLike = (track, e) => {
    e.stopPropagation();
    const currentLiked = JSON.parse(localStorage.getItem('likedSongs')) || [];
    const newLiked = currentLiked.filter(t => t.trackId !== track.trackId);
    setLikedSongs(newLiked);
    localStorage.setItem('likedSongs', JSON.stringify(newLiked));
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  return (
    <div style={{ padding: isMobile ? '16px' : '24px', color: 'var(--text-base)', paddingBottom: isMobile ? '160px' : '120px' }}>
      <div style={{ display: 'flex', alignItems: isMobile ? 'center' : 'flex-end', gap: isMobile ? '16px' : '24px', marginBottom: isMobile ? '24px' : '32px' }}>
        <div style={{ width: isMobile ? '100px' : '232px', height: isMobile ? '100px' : '232px', background: 'linear-gradient(135deg, #450af5, #c4efd9)', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 60px rgba(0,0,0,.5)', borderRadius: isMobile ? '8px' : '0', flexShrink: 0 }}>
          <Heart size={isMobile ? 32 : 64} fill="white" color="white" />
        </div>
        <div>
          <h5 style={{ fontSize: isMobile ? '12px' : '14px', fontWeight: '700', margin: '0 0 4px 0' }}>Playlist</h5>
          <h1 style={{ fontSize: isMobile ? '28px' : '96px', fontWeight: '900', margin: '0 0 8px 0', letterSpacing: '-0.04em', lineHeight: 1.1 }}>{t('likedSongsTitle', lang)}</h1>
          <div style={{ color: 'var(--text-subdued)', fontWeight: '600', fontSize: isMobile ? '13px' : '16px' }}>
            {likedSongs.length} {t('songs', lang).toLowerCase()}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {likedSongs.length === 0 ? (
          <div style={{ color: 'var(--text-subdued)', textAlign: 'center', padding: '32px 0' }}>{t('noLikedSongs', lang) || 'No liked songs yet.'}</div>
        ) : (
          likedSongs.map((track, index) => (
            <div 
              key={track.trackId}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                padding: isMobile ? '8px' : '8px 16px', 
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
                gap: isMobile ? '10px' : '0'
              }}
              onClick={() => playTrack(track, likedSongs)}
            >
              {!isMobile && (
                <div style={{ width: '32px', color: 'var(--text-subdued)', textAlign: 'right', marginRight: '16px', flexShrink: 0 }}>
                  {index + 1}
                </div>
              )}
              <img src={track.artworkUrl100} alt={track.trackName} style={{ width: isMobile ? '44px' : '48px', height: isMobile ? '44px' : '48px', borderRadius: '4px', objectFit: 'cover', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: 'var(--text-base)', fontSize: isMobile ? '14px' : '16px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.trackName}</div>
                <div style={{ color: 'var(--text-subdued)', fontSize: isMobile ? '12px' : '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {track.artistName}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '16px', flexShrink: 0 }}>
                <div onClick={(e) => toggleLike(track, e)} style={{ minWidth: '28px', minHeight: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Heart size={isMobile ? 18 : 20} fill="#1ed760" color="#1ed760" />
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
              {!isMobile && (
                <div style={{ color: 'var(--text-subdued)', fontSize: '14px', marginLeft: '16px', flexShrink: 0 }}>
                  {Math.floor(track.trackTimeMillis / 60000)}:
                  {((track.trackTimeMillis % 60000) / 1000).toFixed(0).padStart(2, '0')}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LikedSongs;
