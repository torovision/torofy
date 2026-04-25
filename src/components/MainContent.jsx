import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { t } from '../utils/i18n';
import { API_URL } from '../utils/config';

const TrackShelf = ({ title, tracks, isMobile, playTrack }) => (
  <div style={{ marginTop: '40px' }}>
    <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '16px' }}>{title}</h3>
    <div style={{ 
      display: isMobile ? 'flex' : 'grid', 
      gridTemplateColumns: isMobile ? 'none' : 'repeat(auto-fill, minmax(180px, 1fr))', 
      gap: isMobile ? '16px' : '24px',
      overflowX: isMobile ? 'auto' : 'visible',
      paddingBottom: isMobile ? '16px' : '0',
      WebkitOverflowScrolling: 'touch'
    }}>
      {tracks.map((track) => (
        <div 
          key={track.trackId} 
          className="glass-panel"
          style={{ 
            minWidth: isMobile ? '140px' : 'auto',
            width: isMobile ? '140px' : 'auto',
            padding: isMobile ? '12px' : '16px', 
            borderRadius: '8px', 
            cursor: 'pointer',
            transition: 'background-color 0.3s ease',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? '8px' : '12px',
            flexShrink: 0
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-elevated-highlight)';
            e.currentTarget.querySelector('.play-btn').style.opacity = '1';
            e.currentTarget.querySelector('.play-btn').style.transform = 'translateY(0)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.querySelector('.play-btn').style.opacity = '0';
            e.currentTarget.querySelector('.play-btn').style.transform = 'translateY(8px)';
          }}
          onClick={() => playTrack(track, tracks)}
        >
          <div style={{ position: 'relative' }}>
            <img 
              src={track.artworkUrl100.replace('100x100', '300x300')} 
              alt={track.trackName} 
              style={{ width: '100%', aspectRatio: '1/1', borderRadius: '4px', objectFit: 'cover', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }} 
            />
            <button 
              className="play-btn"
              style={{
                position: 'absolute',
                bottom: '8px',
                right: '8px',
                width: '48px',
                height: '48px',
                backgroundColor: 'var(--text-bright-accent)',
                borderRadius: '50%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                border: 'none',
                color: '#000',
                boxShadow: '0 8px 8px rgba(0,0,0,0.3)',
                opacity: isMobile ? 1 : 0,
                transform: isMobile ? 'none' : 'translateY(8px)',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onClick={(e) => {
                e.stopPropagation();
                playTrack(track, tracks);
              }}
            >
              <Play size={24} fill="currentColor" style={{ marginLeft: '4px' }} />
            </button>
          </div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '4px' }} className="truncate">{track.trackName}</div>
            <div style={{ color: 'var(--text-subdued)', fontSize: '14px' }} className="truncate-2-lines">{track.artistName}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const MainContent = ({ playTrack, lang }) => {
  const [featured, setFeatured] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [extraShelves, setExtraShelves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [featuredTitle, setFeaturedTitle] = useState('Featured Pop Hits');

  useEffect(() => {
    const liked = JSON.parse(localStorage.getItem('likedSongs')) || [];
    const recs = JSON.parse(localStorage.getItem('torofy_recentArtists')) || [];
    
    let term = 'pop';
    let title = 'Featured Pop Hits';

    if (liked.length > 0) {
      const randomLiked = liked[Math.floor(Math.random() * liked.length)];
      term = randomLiked.artistName;
      title = `Because you like ${term}`;
    } else if (recs.length > 1) {
      term = recs[1];
      title = `More from ${term}`;
    }

    setFeaturedTitle(title);

    // Fetch personalized hits based on preferences
    axios.get(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&limit=6&entity=song`)
      .then(res => {
        setFeatured(res.data.results);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });

    if (recs.length > 0) {
      setLoadingRecs(true);
      // Fetch songs based on their most recent artist
      axios.get(`${API_URL}/api/search?q=${encodeURIComponent(recs[0] + ' music')}`)
        .then(res => {
          if (res.data.results) {
            setRecommendations(res.data.results.slice(0, 10)); // Top 10 recommendations
          }
        })
        .finally(() => setLoadingRecs(false));
    }

    if (recs.length > 1) {
      const extraArtists = recs.slice(1, 4); // Get up to 3 more artists they listened to
      const fetchPromises = extraArtists.map(artist => 
        axios.get(`https://itunes.apple.com/search?term=${encodeURIComponent(artist)}&limit=6&entity=song`)
          .then(res => ({ title: `More from ${artist}`, tracks: res.data.results }))
          .catch(() => null)
      );

      Promise.all(fetchPromises).then(results => {
        setExtraShelves(results.filter(r => r && r.tracks && r.tracks.length > 0));
      });
    }
  }, []);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('goodMorning', lang);
    if (hour < 18) return t('goodAfternoon', lang);
    return t('goodEvening', lang);
  };

  const isMobile = window.innerWidth <= 768;

  return (
    <div style={{ padding: isMobile ? '16px' : '24px', color: 'var(--text-base)', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: '700' }}>{greeting()}</h2>
      </div>

      {/* Recommendations Row */}
      {recommendations.length > 0 && (
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '16px' }}>{t('recommendedForYou', lang)}</h2>
          <div style={{ display: 'flex', gap: isMobile ? '12px' : '24px', overflowX: 'auto', paddingBottom: '16px', WebkitOverflowScrolling: 'touch' }}>
            {loadingRecs ? (
              <div style={{ color: 'var(--text-subdued)' }}>{t('generatingRecs', lang)}</div>
            ) : (
              recommendations.map(track => (
                <div 
                  key={track.trackId}
                  style={{ minWidth: isMobile ? '130px' : '160px', width: isMobile ? '130px' : '160px', backgroundColor: '#181818', padding: isMobile ? '12px' : '16px', borderRadius: '8px', cursor: 'pointer', transition: 'background-color 0.2s ease' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#282828'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#181818'}
                  onClick={() => playTrack(track, recommendations)}
                >
                  <img src={track.artworkUrl100} alt={track.trackName} style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: '4px', marginBottom: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }} />
                  <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 8px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.trackName}</h3>
                  <Link to={`/artist/${encodeURIComponent(track.artistName)}`} onClick={(e) => e.stopPropagation()} style={{ color: 'var(--text-subdued)', fontSize: '14px', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', textDecoration: 'none' }} className="hover-underline">{track.artistName}</Link>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {loading ? (
        <div style={{ color: 'var(--text-subdued)', marginTop: '40px' }}>Loading...</div>
      ) : (
        <TrackShelf title={featuredTitle} tracks={featured} isMobile={isMobile} playTrack={playTrack} />
      )}

      {extraShelves.map((shelf, idx) => (
        <TrackShelf key={idx} title={shelf.title} tracks={shelf.tracks} isMobile={isMobile} playTrack={playTrack} />
      ))}
    </div>
  );
};

export default MainContent;
