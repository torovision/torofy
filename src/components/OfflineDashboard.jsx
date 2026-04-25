import React, { useState, useEffect } from 'react';
import { WifiOff, Play, DownloadCloud, Trash2 } from 'lucide-react';
import { getOfflineTracks, removeOfflineTrack } from '../utils/offlineCache';

const OfflineDashboard = ({ playTrack }) => {
  const [offlineTracks, setOfflineTracks] = useState([]);
  const isMobile = window.innerWidth <= 768;

  useEffect(() => {
    // Load tracks on mount
    setOfflineTracks(getOfflineTracks());

    // Listen for storage changes in case they delete a track while offline
    const handleStorageChange = (e) => {
      if (e.key === 'torofy_offlineTracks') {
        setOfflineTracks(getOfflineTracks());
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleDelete = async (trackId, e) => {
    e.stopPropagation();
    const success = await removeOfflineTrack(trackId);
    if (success) {
      setOfflineTracks(getOfflineTracks());
    }
  };

  return (
    <div style={{ padding: isMobile ? '16px' : '32px', color: 'white', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Offline Banner Header */}
      <div style={{ 
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
        backgroundColor: 'rgba(255, 59, 48, 0.1)', border: '1px solid rgba(255, 59, 48, 0.3)',
        borderRadius: '16px', padding: '32px', marginBottom: '40px', textAlign: 'center'
      }}>
        <div style={{ background: 'rgba(255, 59, 48, 0.2)', padding: '16px', borderRadius: '50%', marginBottom: '16px' }}>
          <WifiOff size={48} color="#ff3b30" />
        </div>
        <h1 style={{ fontSize: isMobile ? '28px' : '40px', fontWeight: '900', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>You are Offline</h1>
        <p style={{ color: 'var(--text-subdued)', fontSize: '16px', maxWidth: '500px', margin: 0, lineHeight: '1.5' }}>
          Your connection was lost. While you are offline, you can continue listening to your downloaded tracks below. Normal app features will return once you reconnect.
        </p>
      </div>

      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>Your Downloads</h2>

      {offlineTracks.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', color: 'var(--text-subdued)' }}>
          <DownloadCloud size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <h2>No downloaded music</h2>
          <p>You haven't downloaded any tracks for offline listening yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '120px' }}>
          {offlineTracks.map((track, index) => (
            <div 
              key={track.trackId}
              onClick={() => playTrack(track, offlineTracks)}
              style={{ 
                display: 'flex', alignItems: 'center', padding: '12px 16px', borderRadius: '8px', 
                cursor: 'pointer', transition: 'background-color 0.2s', backgroundColor: 'rgba(255,255,255,0.05)'
              }}
            >
              <div style={{ width: '32px', color: 'var(--text-subdued)', fontSize: '14px', marginRight: '16px' }}>{index + 1}</div>
              <img src={track.artworkUrl100} style={{ width: '48px', height: '48px', borderRadius: '4px', objectFit: 'cover', marginRight: '16px' }} />
              
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: 'white', fontSize: '16px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '4px' }}>
                  {track.trackName}
                </div>
                <div style={{ color: 'var(--text-subdued)', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {track.artistName}
                </div>
              </div>

              <div 
                style={{ padding: '8px', cursor: 'pointer', color: 'var(--text-subdued)', marginLeft: '16px' }}
                onClick={(e) => handleDelete(track.trackId, e)}
              >
                <Trash2 size={20} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OfflineDashboard;
