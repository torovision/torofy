import React, { useState, useEffect } from 'react';
import { History as HistoryIcon, Play } from 'lucide-react';
import { t } from '../utils/i18n';

const History = ({ playTrack, lang }) => {
  const [history, setHistory] = useState([]);
  const isMobile = window.innerWidth <= 768;

  useEffect(() => {
    const rawHistory = JSON.parse(localStorage.getItem('torofy_playbackHistory')) || [];
    setHistory(rawHistory);
  }, []);

  return (
    <div style={{ padding: isMobile ? '16px' : '32px', color: 'white', minHeight: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <div style={{ width: '64px', height: '64px', backgroundColor: '#282828', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <HistoryIcon size={32} color="white" />
        </div>
        <div>
          <h1 style={{ fontSize: isMobile ? '24px' : '36px', fontWeight: 'bold', margin: '0 0 8px 0' }}>Recently Played</h1>
          <p style={{ color: 'var(--text-subdued)', margin: 0 }}>Your listening history</p>
        </div>
      </div>

      {history.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', color: 'var(--text-subdued)' }}>
          <HistoryIcon size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <h2>No history yet</h2>
          <p>Songs you play will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {history.map((track, index) => (
            <div 
              key={track.trackId + '-' + index}
              onClick={() => playTrack(track, history)}
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
