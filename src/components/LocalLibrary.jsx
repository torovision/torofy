import React, { useState, useEffect } from 'react';
import { Play, Trash2, Music, Heart, ListMusic } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAllTracks, deleteTrack } from '../utils/db';
import { t } from '../utils/i18n';

const LocalLibrary = ({ playTrack, lang }) => {
  const [localFiles, setLocalFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likedCount, setLikedCount] = useState(0);
  const [playlists, setPlaylists] = useState([]);
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  const loadTracks = async () => {
    setLoading(true);
    try {
      const tracks = await getAllTracks();
      setLocalFiles(tracks.sort((a, b) => b.savedAt - a.savedAt));
    } catch (err) {
      console.error('Failed to load offline tracks:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTracks();
    const liked = JSON.parse(localStorage.getItem('likedSongs')) || [];
    setLikedCount(liked.length);
    const pls = JSON.parse(localStorage.getItem('torofy_playlists')) || [];
    setPlaylists(pls);
  }, []);

  const playLocalFile = (track) => {
    const objectUrl = URL.createObjectURL(track.blob);
    playTrack({
      trackId: track.trackId,
      trackName: track.trackName,
      artistName: track.artistName,
      artworkUrl100: track.artworkUrl100,
      trackTimeMillis: track.trackTimeMillis,
      url: objectUrl,
      isLocal: true
    });
  };

  const handleDelete = async (trackId, e) => {
    e.stopPropagation();
    if (window.confirm('Remove this song from your offline library?')) {
      await deleteTrack(trackId);
      setLocalFiles(prev => prev.filter(t => t.trackId !== trackId));
    }
  };

  return (
    <div style={{ padding: isMobile ? '16px' : '24px', color: 'var(--text-base)', paddingBottom: isMobile ? '160px' : '120px' }}>
      <h1 style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: '900', marginBottom: '24px' }}>{t('yourLibrary', lang)}</h1>

      {/* Quick Access Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px', marginBottom: '32px' }}>
        {/* Liked Songs Card */}
        <Link to="/liked" style={{ textDecoration: 'none' }}>
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: '16px',
            backgroundColor: '#181818', borderRadius: '6px', overflow: 'hidden',
            cursor: 'pointer', transition: 'background-color 0.2s',
            height: isMobile ? '56px' : '64px'
          }}>
            <div style={{ width: isMobile ? '56px' : '64px', height: '100%', background: 'linear-gradient(135deg, #450af5, #c4efd9)', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
              <Heart size={isMobile ? 20 : 24} fill="white" color="white" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: 'var(--text-base)', fontSize: isMobile ? '14px' : '16px', fontWeight: '700' }}>{t('likedSongsTitle', lang)}</div>
              <div style={{ color: 'var(--text-subdued)', fontSize: '12px' }}>{likedCount} {t('songs', lang).toLowerCase()}</div>
            </div>
          </div>
        </Link>

        {/* Playlist Cards */}
        {playlists.map(pl => (
          <Link key={pl.id} to={`/playlist/${pl.id}`} style={{ textDecoration: 'none' }}>
            <div style={{ 
              display: 'flex', alignItems: 'center', gap: '16px',
              backgroundColor: '#181818', borderRadius: '6px', overflow: 'hidden',
              cursor: 'pointer', transition: 'background-color 0.2s',
              height: isMobile ? '56px' : '64px'
            }}>
              <div style={{ width: isMobile ? '56px' : '64px', height: '100%', background: 'linear-gradient(135deg, #1a1a1a, #333)', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                <ListMusic size={isMobile ? 20 : 24} color="#1ed760" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: 'var(--text-base)', fontSize: isMobile ? '14px' : '16px', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pl.name}</div>
                <div style={{ color: 'var(--text-subdued)', fontSize: '12px' }}>{pl.tracks?.length || 0} {t('songs', lang).toLowerCase()}</div>
              </div>
            </div>
          </Link>
        ))}

        {/* Offline Files Card */}
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: '16px',
          backgroundColor: '#181818', borderRadius: '6px', overflow: 'hidden',
          height: isMobile ? '56px' : '64px'
        }}>
          <div style={{ width: isMobile ? '56px' : '64px', height: '100%', background: 'linear-gradient(135deg, #1ed760, #004d21)', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
            <Music size={isMobile ? 20 : 24} color="white" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: 'var(--text-base)', fontSize: isMobile ? '14px' : '16px', fontWeight: '700' }}>{t('localFiles', lang)}</div>
            <div style={{ color: 'var(--text-subdued)', fontSize: '12px' }}>{localFiles.length} {t('offline', lang).toLowerCase()}</div>
          </div>
        </div>
      </div>

      {/* Downloaded Songs Section */}
      <h2 style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: '700', marginBottom: '16px' }}>
        {t('localFiles', lang)} ({localFiles.length})
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {loading ? (
          <div style={{ color: 'var(--text-subdued)', padding: '32px 0' }}>{t('loadingOffline', lang)}</div>
        ) : localFiles.length === 0 ? (
          <div style={{ color: 'var(--text-subdued)', padding: '32px 0', textAlign: 'center' }}>
            <Music size={48} color="var(--text-subdued)" style={{ marginBottom: '16px', opacity: 0.5 }} />
            <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>{t('noOfflineSongs', lang)}</div>
            <div style={{ fontSize: '14px' }}>{t('noOfflineDesc', lang)}</div>
          </div>
        ) : (
          localFiles.map((track, index) => (
            <div 
              key={track.trackId}
              style={{ 
                display: 'flex', alignItems: 'center', 
                padding: isMobile ? '8px' : '8px 16px', 
                borderRadius: '4px', cursor: 'pointer',
                transition: 'background-color 0.2s ease',
                gap: isMobile ? '10px' : '0'
              }}
              onClick={() => playLocalFile(track)}
            >
              {!isMobile && (
                <div style={{ width: '32px', color: 'var(--text-subdued)', textAlign: 'right', marginRight: '16px', flexShrink: 0 }}>
                  {index + 1}
                </div>
              )}
              <img src={track.artworkUrl100} alt={track.trackName}
                style={{ width: isMobile ? '44px' : '48px', height: isMobile ? '44px' : '48px', borderRadius: '4px', objectFit: 'cover', flexShrink: 0 }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: 'var(--text-base)', fontSize: isMobile ? '14px' : '16px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.trackName}</div>
                <div style={{ color: 'var(--text-subdued)', fontSize: isMobile ? '12px' : '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.artistName}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '16px', flexShrink: 0 }}>
                <div style={{ color: '#1ed760', fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(30, 215, 96, 0.1)', fontWeight: '600' }}>
                  {t('offline', lang)}
                </div>
                <div onClick={(e) => handleDelete(track.trackId, e)} style={{ cursor: 'pointer', color: 'var(--text-subdued)', minWidth: '28px', minHeight: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Trash2 size={16} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LocalLibrary;
