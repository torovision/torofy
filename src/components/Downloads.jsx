import React, { useState, useEffect } from 'react';
import { Play, DownloadCloud, Trash2 } from 'lucide-react';
import { getOfflineTracks, removeOfflineTrack } from '../utils/offlineCache';
import { t } from '../utils/i18n';

const Downloads = ({ playTrack, lang }) => {
  const [tracks, setTracks] = useState([]);

  useEffect(() => {
    loadTracks();
  }, []);

  const loadTracks = () => {
    setTracks(getOfflineTracks());
  };

  const handleRemove = async (e, trackId) => {
    e.stopPropagation();
    await removeOfflineTrack(trackId);
    loadTracks();
  };

  const isMobile = window.innerWidth <= 768;

  return (
    <div style={{ padding: isMobile ? '16px' : '32px', color: 'white', minHeight: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <div style={{ width: '64px', height: '64px', backgroundColor: '#1ed760', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 8px 24px rgba(30,215,96,0.3)' }}>
          <DownloadCloud size={32} color="black" />
        </div>
        <div>
          <h1 style={{ fontSize: isMobile ? '24px' : '36px', fontWeight: 'bold', margin: '0 0 8px 0' }}>Downloads</h1>
          <p style={{ color: 'var(--text-subdued)', margin: 0 }}>{tracks.length} tracks available offline</p>
        </div>
      </div>

      {tracks.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', color: 'var(--text-subdued)' }}>
          <DownloadCloud size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <h2>No downloaded tracks</h2>
          <p>Songs you download will appear here for offline playback.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {tracks.map((track, index) => (
            <div 
              key={track.trackId}
              onClick={() => playTrack(track, tracks)}
              style={{ display: 'flex', alignItems: 'center', padding: '12px', borderRadius: '8px', cursor: 'pointer', transition: 'background-color 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div style={{ width: '32px', textAlign: 'center', color: 'var(--text-subdued)', fontSize: '14px', marginRight: '16px' }}>{index + 1}</div>
              <img src={track.artworkUrl100} style={{ width: '48px', height: '48px', borderRadius: '4px', marginRight: '16px' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: 'white', fontSize: '16px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '4px' }}>{track.trackName}</div>
                <div style={{ color: 'var(--text-subdued)', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.artistName}</div>
              </div>
              <button 
                onClick={(e) => handleRemove(e, track.trackId)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', color: 'var(--text-subdued)' }}
                onMouseEnter={e => e.currentTarget.style.color = '#ff4d4d'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-subdued)'}
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Downloads;
