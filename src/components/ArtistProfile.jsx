import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Play, Heart, Download } from 'lucide-react';
import { API_URL } from '../utils/config';

const ArtistProfile = ({ playTrack }) => {
  const { name } = useParams();
  const [artistData, setArtistData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [likedSongs, setLikedSongs] = useState([]);

  useEffect(() => {
    setLikedSongs(JSON.parse(localStorage.getItem('likedSongs')) || []);
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
    setLikedSongs(currentLiked);
    localStorage.setItem('likedSongs', JSON.stringify(currentLiked));
  };

  const handleDownload = (track, e) => {
    e.stopPropagation();
    const query = track.url ? track.url : (track.trackName + ' ' + track.artistName);
    const downloadUrl = `${API_URL}/api/download?url=${encodeURIComponent(query)}&title=${encodeURIComponent(track.trackName)}`;
    window.location.href = downloadUrl;
  };

  useEffect(() => {
    setLoading(true);
    axios.get(`${API_URL}/api/artist?name=${encodeURIComponent(name)}`)
      .then(res => {
        setArtistData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [name]);

  if (loading) {
    return <div style={{ padding: '24px', color: 'var(--text-subdued)' }}>Loading artist...</div>;
  }

  if (!artistData) {
    return <div style={{ padding: '24px', color: 'var(--text-subdued)' }}>Artist not found.</div>;
  }

  const { artistInfo, popularTracks, playlists } = artistData;
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  return (
    <div style={{ color: 'var(--text-base)', paddingBottom: isMobile ? '160px' : '120px' }}>
      {/* Banner */}
      <div style={{ 
        height: isMobile ? '200px' : '340px', 
        backgroundImage: `linear-gradient(transparent, rgba(0,0,0,0.8)), url(${artistInfo.image.replace('s88', 's800')})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'flex-end',
        padding: isMobile ? '16px' : '24px'
      }}>
        <div style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: '#3d91f4', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <span style={{ fontSize: '12px', fontWeight: '500' }}>Verified Artist</span>
          </div>
          <h1 style={{ fontSize: isMobile ? '36px' : '96px', fontWeight: '900', margin: '0 0 8px 0', letterSpacing: '-0.04em', lineHeight: '1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{artistInfo.name}</h1>
          <div style={{ fontSize: isMobile ? '13px' : '16px', fontWeight: '500', color: 'var(--text-subdued)' }}>
            {artistInfo.subscribers} monthly listeners
          </div>
        </div>
      </div>

      <div style={{ padding: isMobile ? '16px' : '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <button onClick={() => playTrack(popularTracks[0], popularTracks)} style={{ width: isMobile ? '48px' : '56px', height: isMobile ? '48px' : '56px', borderRadius: '50%', backgroundColor: '#1ed760', border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}>
            <Play size={isMobile ? 24 : 28} fill="black" color="black" style={{ marginLeft: '3px' }} />
          </button>
          <button style={{ backgroundColor: 'transparent', border: '1px solid var(--text-subdued)', color: 'var(--text-base)', padding: '6px 16px', borderRadius: '500px', fontWeight: '700', cursor: 'pointer', fontSize: isMobile ? '13px' : '14px' }}>
            Follow
          </button>
        </div>

        <h2 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '700', marginBottom: '12px' }}>Popular</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '48px' }}>
          {popularTracks.map((track, index) => {
            const isLiked = likedSongs.find(t => t.trackId === track.trackId);
            return (
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
                onClick={() => playTrack(track, popularTracks)}
              >
                {!isMobile && (
                  <div style={{ width: '32px', color: 'var(--text-subdued)', textAlign: 'right', marginRight: '16px', flexShrink: 0 }}>
                    {index + 1}
                  </div>
                )}
                <img src={track.artworkUrl100} alt={track.trackName} style={{ width: isMobile ? '44px' : '48px', height: isMobile ? '44px' : '48px', borderRadius: '4px', objectFit: 'cover', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: 'var(--text-base)', fontSize: isMobile ? '14px' : '16px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.trackName}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '16px', flexShrink: 0 }}>
                  <div onClick={(e) => toggleLike(track, e)} style={{ minWidth: '28px', minHeight: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isLiked ? <Heart size={isMobile ? 18 : 20} fill="#1ed760" color="#1ed760" /> : <Heart size={isMobile ? 18 : 20} color="var(--text-subdued)" />}
                  </div>
                </div>
                {!isMobile && (
                  <div style={{ color: 'var(--text-subdued)', fontSize: '14px', marginLeft: '16px' }}>
                    {Math.floor(track.trackTimeMillis / 60000)}:
                    {((track.trackTimeMillis % 60000) / 1000).toFixed(0).padStart(2, '0')}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {playlists.length > 0 && (
          <>
            <h2 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: '700', marginBottom: '16px' }}>Featuring {artistInfo.name}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(180px, 1fr))', gap: isMobile ? '12px' : '24px' }}>
              {playlists.map(playlist => (
                <div key={playlist.id} style={{ backgroundColor: '#181818', padding: isMobile ? '10px' : '16px', borderRadius: '8px', cursor: 'pointer', transition: 'background-color 0.2s ease' }}>
                  <img src={playlist.image} alt={playlist.title} style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: '4px', marginBottom: isMobile ? '8px' : '16px' }} />
                  <div style={{ fontWeight: '700', fontSize: isMobile ? '13px' : '16px', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{playlist.title}</div>
                  <div style={{ color: 'var(--text-subdued)', fontSize: isMobile ? '12px' : '14px' }}>{playlist.videoCount} Tracks</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ArtistProfile;
