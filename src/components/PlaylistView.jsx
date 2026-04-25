import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Play, Heart, PlusSquare, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const PlaylistView = ({ playTrack }) => {
  const { id } = useParams();
  const [playlist, setPlaylist] = useState(null);

  useEffect(() => {
    const playlists = JSON.parse(localStorage.getItem('torofy_playlists')) || [];
    const found = playlists.find(p => p.id === id);
    setPlaylist(found);
  }, [id]);

  const removeTrack = (trackId, e) => {
    e.stopPropagation();
    const playlists = JSON.parse(localStorage.getItem('torofy_playlists')) || [];
    const pIndex = playlists.findIndex(p => p.id === id);
    if (pIndex !== -1) {
      playlists[pIndex].tracks = playlists[pIndex].tracks.filter(t => t.trackId !== trackId);
      localStorage.setItem('torofy_playlists', JSON.stringify(playlists));
      setPlaylist(playlists[pIndex]);
    }
  };

  if (!playlist) return <div style={{ padding: '24px', color: 'var(--text-subdued)' }}>Loading...</div>;

  return (
    <div style={{ padding: '24px', color: 'var(--text-base)', paddingBottom: '120px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '24px', marginBottom: '32px' }}>
        <div style={{ width: '232px', height: '232px', background: 'linear-gradient(135deg, #181818, #282828)', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 60px rgba(0,0,0,.5)' }}>
          <PlusSquare size={64} color="var(--text-subdued)" />
        </div>
        <div>
          <h5 style={{ fontSize: '14px', fontWeight: '700', margin: '0 0 8px 0' }}>Playlist</h5>
          <h1 style={{ fontSize: '96px', fontWeight: '900', margin: '0 0 16px 0', letterSpacing: '-0.04em' }}>{playlist.name}</h1>
          <div style={{ color: 'var(--text-subdued)', fontWeight: '600' }}>
            {playlist.tracks.length} songs
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {playlist.tracks.length === 0 ? (
          <div style={{ color: 'var(--text-subdued)' }}>No songs in this playlist yet. Add songs from search or library!</div>
        ) : (
          playlist.tracks.map((track, index) => (
            <div 
              key={track.trackId}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                padding: '8px 16px', 
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.querySelector('.track-index').style.display = 'none';
                e.currentTarget.querySelector('.track-play').style.display = 'block';
                e.currentTarget.querySelector('.remove-btn').style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.querySelector('.track-index').style.display = 'block';
                e.currentTarget.querySelector('.track-play').style.display = 'none';
                e.currentTarget.querySelector('.remove-btn').style.opacity = '0';
              }}
              onClick={() => playTrack(track, playlist.tracks)}
            >
              <div style={{ width: '32px', color: 'var(--text-subdued)', textAlign: 'right', marginRight: '16px' }}>
                <span className="track-index">{index + 1}</span>
                <Play size={16} fill="currentColor" className="track-play" style={{ display: 'none', margin: '0 auto' }} />
              </div>
              <img src={track.artworkUrl100} alt={track.trackName} style={{ width: '48px', height: '48px', borderRadius: '4px', objectFit: 'cover', marginRight: '16px' }} />
              <div style={{ flex: 1 }}>
                <div style={{ color: 'var(--text-base)', fontSize: '16px', fontWeight: '500' }}>{track.trackName}</div>
                <Link to={`/artist/${encodeURIComponent(track.artistName)}`} onClick={(e) => e.stopPropagation()} style={{ color: 'var(--text-subdued)', fontSize: '14px', textDecoration: 'none' }} className="hover-underline">
                  {track.artistName}
                </Link>
              </div>
              <div 
                className="remove-btn" 
                style={{ opacity: 0, transition: 'opacity 0.2s', marginRight: '32px' }} 
                onClick={(e) => removeTrack(track.trackId, e)}
                title="Remove from playlist"
              >
                <Trash2 size={20} color="var(--text-subdued)" />
              </div>
              <div style={{ color: 'var(--text-subdued)', fontSize: '14px' }}>
                {Math.floor(track.trackTimeMillis / 60000)}:
                {((track.trackTimeMillis % 60000) / 1000).toFixed(0).padStart(2, '0')}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PlaylistView;
