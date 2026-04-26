import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Repeat, Shuffle, Heart, Mic2, X, ChevronDown, Share2, ListMusic } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../utils/config';
import { isTrackOffline, getOfflineStreamUrl, downloadTrack } from '../utils/offlineCache';
import { DownloadCloud } from 'lucide-react';
import YouTube from 'react-youtube';

// Tiny silent MP3 to unlock iOS audio
const SILENCE_MP3 = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYoRwTHAAAAAAD/+1DEAAAHAAGSdAAAAgAANIAAAARMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7UMQbAPAAAaQAAAAAAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQ==';

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const Player = ({ currentTrack, isPlaying, setIsPlaying, playNext, playPrev, isShuffle, setIsShuffle, isRepeat, setIsRepeat, onAutoEnded, queue, setQueue, queueIndex, playTrackFromQueue, dataSaver }) => {
  const audioRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [streamUrl, setStreamUrl] = useState(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyrics, setLyrics] = useState('');
  const [syncedLyrics, setSyncedLyrics] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const lyricsContainerRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [dominantColor, setDominantColor] = useState('rgba(30,30,30,0.95)');
  const [showQueue, setShowQueue] = useState(false);
  const [prefetchedTrackId, setPrefetchedTrackId] = useState(null);
  const [nextStreamUrl, setNextStreamUrl] = useState(null);
  
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [isMobile] = useState(typeof window !== 'undefined' && window.innerWidth <= 768);
  const [ytPlayer, setYtPlayer] = useState(null);
  const [resolvedYtId, setResolvedYtId] = useState(null);

  const durationSecs = duration > 0 ? duration : (currentTrack ? (currentTrack.trackTimeMillis / 1000) : 0);
  const progressPercent = durationSecs > 0 ? (currentTime / durationSecs) * 100 : 0;

  // Unlock audio on first user interaction (iOS requirement)
  const unlockAudio = useCallback(() => {
    if (audioUnlocked || !audioRef.current) return;
    const audio = audioRef.current;
    
    // If it's already playing something else, it's already unlocked
    if (audio.src && audio.src !== SILENCE_MP3 && !audio.paused) {
      setAudioUnlocked(true);
      return;
    }

    audio.src = SILENCE_MP3;
    audio.volume = 0;
    const p = audio.play();
    if (p) {
      p.then(() => {
        audio.pause();
        audio.volume = volume;
        setAudioUnlocked(true);
      }).catch(() => {});
    }
  }, [audioUnlocked, volume]);

  useEffect(() => {
    if (audioUnlocked) return;
    const handler = () => unlockAudio();
    document.addEventListener('touchstart', handler, { once: true });
    document.addEventListener('click', handler, { once: true });
    return () => {
      document.removeEventListener('touchstart', handler);
      document.removeEventListener('click', handler);
    };
  }, [audioUnlocked, unlockAudio]);

  // If audio successfully plays, we know it's unlocked
  useEffect(() => {
    if (isPlaying && !audioUnlocked) {
      setAudioUnlocked(true);
    }
  }, [isPlaying, audioUnlocked]);

  // Fetch stream URL when track changes
  useEffect(() => {
    if (!currentTrack) { setStreamUrl(null); return; }
    const liked = JSON.parse(localStorage.getItem('likedSongs')) || [];
    setIsLiked(!!liked.find(t => t.trackId === currentTrack.trackId));
    isTrackOffline(currentTrack.trackId).then(setIsDownloaded);

    if (currentTrack.artistName && !currentTrack.isLocal) {
      let recs = JSON.parse(localStorage.getItem('torofy_recentArtists')) || [];
      recs = recs.filter(a => a !== currentTrack.artistName);
      recs.unshift(currentTrack.artistName);
      if (recs.length > 5) recs.pop();
      localStorage.setItem('torofy_recentArtists', JSON.stringify(recs));
    }

    // Save to history
    let history = JSON.parse(localStorage.getItem('torofy_playbackHistory')) || [];
    // Only add if it's not the exact same as the last played track
    if (history.length === 0 || history[0].trackId !== currentTrack.trackId) {
      history.unshift(currentTrack);
      if (history.length > 50) history.pop();
      localStorage.setItem('torofy_playbackHistory', JSON.stringify(history));
    }

    if (currentTrack.isLocal) {
      setStreamUrl(currentTrack.url);
      setIsBuffering(false);
      return;
    }

    // For YouTube streaming (client-side)
    setIsBuffering(true);
    setStreamUrl(null);
    setCurrentTime(0);
    setDuration(0);
    setResolvedYtId(null);
    
    // Check if it's cached offline first
    getOfflineStreamUrl(currentTrack.trackId).then(offlineUrl => {
      if (offlineUrl) {
        setStreamUrl(offlineUrl);
      } else {
        // If not offline, resolve YouTube ID if it's from iTunes
        if (currentTrack.isItunes && !currentTrack.youtubeId) {
          axios.get(`${API_URL}/api/get-yt-id?query=${encodeURIComponent(currentTrack.trackName + ' ' + currentTrack.artistName)}`)
            .then(res => {
              if (res.data.videoId) {
                currentTrack.youtubeId = res.data.videoId;
                setResolvedYtId(res.data.videoId);
              } else {
                setIsBuffering(false);
                playNext();
              }
            })
            .catch(() => {
              setIsBuffering(false);
              playNext();
            });
        } else if (currentTrack.youtubeId) {
          setResolvedYtId(currentTrack.youtubeId);
        } else {
          setResolvedYtId(currentTrack.trackId);
        }
      }
    });
  }, [currentTrack, dataSaver]);

  // Poll YouTube player for current time
  useEffect(() => {
    let interval;
    if (isPlaying && ytPlayer && currentTrack && !currentTrack.isLocal && !streamUrl) {
      interval = setInterval(async () => {
        try {
          const time = await ytPlayer.getCurrentTime();
          if (time !== undefined) setCurrentTime(time);
        } catch (e) {}
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, ytPlayer, currentTrack, streamUrl]);

  const onYtReady = (e) => {
    setYtPlayer(e.target);
    e.target.setVolume(volume * 100);
  };

  const onYtStateChange = (e) => {
    // 1 = playing, 2 = paused, 0 = ended, 3 = buffering
    if (e.data === 1) {
      e.target.setVolume(volume * 100); // Enforce max volume
      setIsPlaying(true);
      setIsBuffering(false);
      e.target.getDuration().then(d => setDuration(d));
    } else if (e.data === 2) {
      setIsPlaying(false);
    } else if (e.data === 0) {
      handleEnded();
    } else if (e.data === 3) {
      setIsBuffering(true);
    }
  };

  // Extract dominant color from artwork
  useEffect(() => {
    if (!currentTrack || !currentTrack.artworkUrl100) return;
    setDominantColor('rgba(30,30,30,0.95)');
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext && canvas.getContext('2d');
      if (!context) return;
      canvas.width = img.width; canvas.height = img.height;
      try {
        context.drawImage(img, 0, 0);
        const data = context.getImageData(0, 0, canvas.width, canvas.height);
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.data.length; i += 20) { // check every 5th pixel
          r += data.data[i]; g += data.data[i+1]; b += data.data[i+2];
          count++;
        }
        setDominantColor(`rgba(${~~(r/count)}, ${~~(g/count)}, ${~~(b/count)}, 0.95)`);
      } catch (e) {}
    };
    img.src = `${API_URL}/api/proxy-image?url=${encodeURIComponent(currentTrack.artworkUrl100)}`;
  }, [currentTrack]);

  // Auto-scroll lyrics
  useEffect(() => {
    if (showLyrics && syncedLyrics && lyricsContainerRef.current) {
      const activeEl = lyricsContainerRef.current.querySelector('.active-lyric');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentTime, showLyrics]);

  // Prefetching removed for client-side iframe

  // When stream URL arrives, load and play
  useEffect(() => {
    if (!audioRef.current) return;
    if (!streamUrl) {
      audioRef.current.pause();
      return;
    }
    const audio = audioRef.current;
    audio.src = streamUrl;
    audio.load();
    const playWhenReady = () => {
      audio.volume = volume;
      const p = audio.play();
      if (p) p.then(() => { setIsPlaying(true); setIsBuffering(false); })
              .catch(() => { setIsBuffering(false); setIsPlaying(true); });
    };
    if (audio.readyState >= 3) playWhenReady();
    else audio.addEventListener('canplay', playWhenReady, { once: true });
  }, [streamUrl]);

  const removeFromQueue = (actualIndex, e) => {
    e.stopPropagation();
    const updatedQueue = [...queue];
    updatedQueue.splice(actualIndex, 1);
    setQueue(updatedQueue);
  };

  const clearQueue = () => {
    if (queue && queueIndex >= 0) {
      setQueue([queue[queueIndex]]);
    }
  };

  const togglePlay = useCallback(() => {
    if (!currentTrack) return;
    unlockAudio();
    
    // Local / Offline Track
    if (currentTrack.isLocal || streamUrl) {
      const audio = audioRef.current;
      if (!audio) return;
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        setIsPlaying(true);
        if (!audio.src || audio.src === SILENCE_MP3) return;
        const p = audio.play();
        if (p) p.catch((e) => console.warn('Play failed:', e));
      }
    } 
    // YouTube Client-Side Track
    else if (ytPlayer) {
      if (isPlaying) {
        ytPlayer.pauseVideo();
        setIsPlaying(false);
      } else {
        ytPlayer.playVideo();
        setIsPlaying(true);
      }
    }
  }, [currentTrack, isPlaying, setIsPlaying, unlockAudio, streamUrl, ytPlayer]);

  // Sync play/pause - but DON'T trigger buffering on pause
  useEffect(() => {
    if (!audioRef.current || !streamUrl || audioRef.current.src === SILENCE_MP3) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // Media Session API for Lock Screen Controls
  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: currentTrack.trackName,
        artist: currentTrack.artistName,
        album: 'TOROFY',
        artwork: [
          { src: currentTrack.artworkUrl100, sizes: '100x100', type: 'image/jpeg' },
          { src: currentTrack.artworkUrl100?.replace('100x100', '600x600'), sizes: '600x600', type: 'image/jpeg' }
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => { setIsPlaying(true); });
      navigator.mediaSession.setActionHandler('pause', () => { setIsPlaying(false); });
      navigator.mediaSession.setActionHandler('previoustrack', playPrev);
      navigator.mediaSession.setActionHandler('nexttrack', () => playNext(false));
    }
  }, [currentTrack, playPrev, playNext]);

  const toggleLike = () => {
    if (!currentTrack) return;
    let currentLiked = JSON.parse(localStorage.getItem('likedSongs')) || [];
    if (isLiked) {
      currentLiked = currentLiked.filter(t => t.trackId !== currentTrack.trackId);
      setIsLiked(false);
    } else {
      currentLiked.push(currentTrack);
      setIsLiked(true);
    }
    localStorage.setItem('likedSongs', JSON.stringify(currentLiked));
  };

  const parseSyncedLyrics = (lrcStr) => {
    if (!lrcStr) return null;
    const lines = lrcStr.split('\n');
    const parsed = [];
    lines.forEach(line => {
      const match = line.match(/\[(\d+):(\d+\.\d+)\](.*)/);
      if (match) {
        const mins = parseInt(match[1]);
        const secs = parseFloat(match[2]);
        parsed.push({ time: mins * 60 + secs, text: match[3].trim() });
      }
    });
    return parsed.length > 0 ? parsed : null;
  };

  const toggleLyrics = () => {
    if (!showLyrics && currentTrack && !currentTrack.isLocal) {
      setLyrics('Loading lyrics...');
      setSyncedLyrics(null);
      axios.get(`${API_URL}/api/lyrics?artist=${encodeURIComponent(currentTrack.artistName)}&title=${encodeURIComponent(currentTrack.trackName)}`)
        .then(res => {
          setLyrics(res.data.lyrics || 'Lyrics not found.');
          if (res.data.syncedLyrics) setSyncedLyrics(parseSyncedLyrics(res.data.syncedLyrics));
        }).catch(() => setLyrics('Lyrics not found.'));
    }
    setShowLyrics(!showLyrics);
    setShowQueue(false);
  };

  const handleDownload = async () => {
    if (!currentTrack || isDownloaded || downloading) return;
    setDownloading(true);
    const success = await downloadTrack(currentTrack, dataSaver ? 'low' : 'high');
    if (success) setIsDownloaded(true);
    setDownloading(false);
  };

  const handleTimeUpdate = () => { if (audioRef.current) setCurrentTime(audioRef.current.currentTime); };
  const handleLoadedMetadata = () => { if (audioRef.current && audioRef.current.duration && isFinite(audioRef.current.duration)) setDuration(audioRef.current.duration); };
  const handleSeek = (e) => {
    if (durationSecs > 0) {
      const seekTime = (e.target.value / 100) * durationSecs;
      setCurrentTime(seekTime);
      if (currentTrack.isLocal || streamUrl) {
        if (audioRef.current) audioRef.current.currentTime = seekTime;
      } else if (ytPlayer) {
        ytPlayer.seekTo(seekTime, true);
      }
    }
  };
  const handleVolumeChange = (e) => {
    const newVol = e.target.value / 100;
    setVolume(newVol);
    if (audioRef.current) audioRef.current.volume = newVol;
    if (ytPlayer) ytPlayer.setVolume(newVol * 100);
  };
  const handleEnded = () => { if (onAutoEnded) onAutoEnded(); else if (playNext) playNext(); else setIsPlaying(false); };

  // Touch Gesture Handling
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const touchEndX = useRef(null);
  const touchEndY = useRef(null);
  const lastTap = useRef(0);
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    touchEndX.current = null;
    touchEndY.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
  };

  const onTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
    touchEndY.current = e.targetTouches[0].clientY;
  };

  const onTouchEndAction = (context) => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    
    const dx = touchStartX.current - touchEndX.current;
    const dy = touchStartY.current - touchEndY.current;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) > minSwipeDistance) {
      if (absDx > absDy) {
        // Horizontal Swipe
        if (dx > 0) { if (playNext) playNext(); } // Swipe Left -> Next
        else { if (playPrev) playPrev(); }        // Swipe Right -> Prev
      } else {
        // Vertical Swipe
        if (dy > 0 && context === 'mini') setExpanded(true); // Swipe Up -> Open
        else if (dy < 0 && context === 'expanded') setExpanded(false); // Swipe Down -> Close
      }
    }
    
    // Reset
    touchStartX.current = null;
    touchStartY.current = null;
    touchEndX.current = null;
    touchEndY.current = null;
  };

  const handleArtworkTap = (e) => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      toggleLike();
    }
    lastTap.current = now;
  };

  // ===== FULL-SCREEN EXPANDED PLAYER =====
  if (expanded && currentTrack) {
    return (
      <>
        <audio ref={audioRef} preload="auto" playsInline
          onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleLoadedMetadata} onEnded={handleEnded}
          onWaiting={() => { if (isPlaying) setIsBuffering(true); }}
          onPlaying={() => setIsBuffering(false)} onCanPlay={() => setIsBuffering(false)}
          onError={() => setIsBuffering(false)}
        />
        {!currentTrack.isLocal && !streamUrl && resolvedYtId && (
          <YouTube 
            videoId={resolvedYtId}
            opts={{ height: '0', width: '0', playerVars: { autoplay: 1, controls: 0, disablekb: 1, fs: 0, modestbranding: 1, playsinline: 1 } }}
            onReady={onYtReady}
            onStateChange={onYtStateChange}
            onError={() => { setIsBuffering(false); playNext(); }}
          />
        )}
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: '#000', zIndex: 9999,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: isMobile ? 'env(safe-area-inset-top, 16px) 24px env(safe-area-inset-bottom, 16px)' : '40px',
          background: currentTrack.artworkUrl100 
            ? `linear-gradient(180deg, ${dominantColor} 0%, rgba(0,0,0,1) 70%), url(${currentTrack.artworkUrl100.replace('100x100','600x600')})`
            : '#121212',
          backgroundSize: 'cover', backgroundPosition: 'center',
          transition: 'background 0.5s ease'
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={() => { if (!showQueue && !showLyrics) onTouchEndAction('expanded'); }}
        >
          {/* Inner container - constrained on desktop */}
          <div style={{
            display: 'flex', flexDirection: 'column',
            width: '100%', maxWidth: isMobile ? '100%' : '480px',
            height: '100%', maxHeight: isMobile ? '100%' : '90vh',
          }}>
          {/* Top Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', flexShrink: 0 }}>
            <button onClick={() => setExpanded(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '8px' }}>
              <ChevronDown size={28} />
            </button>
            <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-subdued)' }}>
              Now Playing
            </div>
            <div style={{ width: '44px' }} />
          </div>

          {/* Artwork */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 0 }}>
            <img 
              src={currentTrack.artworkUrl100?.replace('100x100', '600x600')} 
              alt={currentTrack.trackName}
              onClick={handleArtworkTap}
              style={{ 
                width: '100%', maxWidth: isMobile ? '340px' : '420px', aspectRatio: '1/1', 
                borderRadius: '8px', objectFit: 'cover',
                boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                cursor: 'pointer'
              }} 
            />
          </div>

          {/* Track Info */}
          <div style={{ padding: '24px 0 16px', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: 0, marginRight: '16px' }}>
                <div style={{ fontSize: '20px', fontWeight: '700', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentTrack.trackName}
                </div>
                <div style={{ fontSize: '16px', color: 'var(--text-subdued)', marginTop: '4px' }}>
                  {currentTrack.artistName}
                </div>
              </div>
              <button onClick={toggleLike} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}>
                {isLiked ? <Heart size={24} fill="#1ed760" color="#1ed760" /> : <Heart size={24} color="var(--text-subdued)" />}
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ flexShrink: 0, marginBottom: '16px' }}>
            <input type="range" min="0" max="100" value={progressPercent} onChange={handleSeek}
              style={{ width: '100%', height: '4px', accentColor: 'white', margin: 0 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-subdued)' }}>{formatTime(currentTime)}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-subdued)' }}>{formatTime(durationSecs)}</span>
            </div>
          </div>

          {/* Main Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, padding: '0 8px', marginBottom: '24px' }}>
            <button onClick={() => setIsShuffle(!isShuffle)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}>
              <Shuffle size={22} color={isShuffle ? '#1ed760' : 'rgba(255,255,255,0.7)'} />
            </button>
            <button onClick={playPrev} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}>
              <SkipBack size={28} color="white" />
            </button>
            <button onClick={togglePlay} style={{
              width: '64px', height: '64px', borderRadius: '50%',
              backgroundColor: 'white', border: 'none', cursor: 'pointer',
              display: 'flex', justifyContent: 'center', alignItems: 'center'
            }}>
              {isBuffering ? (
                <div style={{ width: '24px', height: '24px', border: '3px solid transparent', borderTopColor: 'black', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
              ) : isPlaying ? (
                <Pause size={28} fill="black" color="black" />
              ) : (
                <Play size={28} fill="black" color="black" style={{ marginLeft: '3px' }} />
              )}
            </button>
            <button onClick={playNext} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}>
              <SkipForward size={28} color="white" />
            </button>
            <button onClick={() => setIsRepeat(!isRepeat)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}>
              <Repeat size={22} color={isRepeat ? '#1ed760' : 'rgba(255,255,255,0.7)'} />
            </button>
          </div>

          {/* Bottom Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', flexShrink: 0 }}>
            {currentTrack && !currentTrack.isLocal ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={toggleLyrics} style={{ background: showLyrics ? '#1ed760' : 'rgba(255,255,255,0.1)', border: 'none', color: showLyrics ? 'black' : 'white', borderRadius: '500px', padding: '8px 20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                  Lyrics
                </button>
                <button onClick={handleDownload} disabled={isDownloaded || downloading} style={{ background: isDownloaded ? '#1ed760' : 'rgba(255,255,255,0.1)', border: 'none', color: isDownloaded ? 'black' : 'white', borderRadius: '500px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: isDownloaded ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <DownloadCloud size={16} /> {downloading ? 'Downloading...' : isDownloaded ? 'Downloaded' : 'Download'}
                </button>
              </div>
            ) : <div />}
            <div style={{ display: 'flex', gap: '16px' }}>
              <button onClick={() => { setShowQueue(!showQueue); setShowLyrics(false); }} style={{ background: 'none', border: 'none', color: showQueue ? '#1ed760' : 'white', cursor: 'pointer', padding: '8px' }}>
                <ListMusic size={24} />
              </button>
            </div>
          </div>

          {/* Queue Overlay in Expanded View */}
          {showQueue && (
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, top: '40%',
              backgroundColor: 'rgba(0,0,0,0.95)', borderRadius: '16px 16px 0 0',
              padding: '20px 24px', overflowY: 'auto', zIndex: 10,
              boxShadow: '0 -10px 40px rgba(0,0,0,0.5)'
            }}>
              <div style={{ position: 'sticky', top: 0, backgroundColor: 'rgba(0,0,0,0.95)', paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 11 }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'white' }}>Up Next</h3>
                <button onClick={() => setShowQueue(false)} style={{ background: 'none', border: 'none', color: 'var(--text-subdued)', cursor: 'pointer' }}><X size={22} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Now Playing Section */}
                {currentTrack && (
                  <div>
                    <h4 style={{ fontSize: '14px', color: 'var(--text-subdued)', fontWeight: '600', marginBottom: '12px', margin: 0 }}>Now Playing</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.1)' }}>
                      <div style={{ position: 'relative' }}>
                        <img src={currentTrack.artworkUrl100} style={{ width: '40px', height: '40px', borderRadius: '4px' }} />
                        {isPlaying && (
                          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: '4px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2px' }}>
                            <div className="eq-bar" style={{ height: '14px' }} />
                            <div className="eq-bar" style={{ height: '18px' }} />
                            <div className="eq-bar" style={{ height: '14px' }} />
                          </div>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: '#1ed760', fontSize: '14px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentTrack.trackName}</div>
                        <div style={{ color: 'var(--text-subdued)', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentTrack.artistName}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Next In Queue Section */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ fontSize: '14px', color: 'var(--text-subdued)', fontWeight: '600', margin: 0 }}>Next In Queue</h4>
                    {queue && queue.length > queueIndex + 1 && (
                      <button onClick={clearQueue} style={{ background: 'none', border: 'none', color: 'var(--text-subdued)', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>Clear</button>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {queue && queue.slice(queueIndex + 1, queueIndex + 50).map((track, i) => {
                      const actualIdx = queueIndex + 1 + i;
                      return (
                        <div key={i} onClick={() => { playTrackFromQueue(actualIdx); setShowQueue(false); setExpanded(false); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '8px', borderRadius: '4px' }}>
                          <img src={track.artworkUrl100} style={{ width: '40px', height: '40px', borderRadius: '4px' }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ color: 'white', fontSize: '14px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.trackName}</div>
                            <div style={{ color: 'var(--text-subdued)', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.artistName}</div>
                          </div>
                          <button onClick={(e) => removeFromQueue(actualIdx, e)} style={{ background: 'none', border: 'none', color: 'var(--text-subdued)', cursor: 'pointer', padding: '4px' }}>
                            <X size={16} />
                          </button>
                        </div>
                      );
                    })}
                    {(!queue || queue.length <= queueIndex + 1) && (
                      <div style={{ color: 'var(--text-subdued)', fontSize: '14px', padding: '8px' }}>No upcoming tracks.</div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Lyrics Overlay in Expanded View */}
          {showLyrics && (
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, top: 0,
              backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(60px) brightness(0.6)',
              padding: '60px 24px', overflowY: 'auto', zIndex: 20,
              display: 'flex', flexDirection: 'column'
            }} ref={lyricsContainerRef}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', position: 'sticky', top: 0, zIndex: 21 }}>
                <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: 'white' }}>Lyrics</h3>
                <button onClick={() => setShowLyrics(false)} style={{ background: 'rgba(0,0,0,0.5)', borderRadius: '50%', padding: '8px', border: 'none', color: 'white', cursor: 'pointer' }}><X size={28} /></button>
              </div>
              
              {syncedLyrics ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '200px', paddingTop: '40vh' }}>
                  {syncedLyrics.map((line, idx) => {
                    const isNext = syncedLyrics[idx + 1];
                    const isActive = currentTime >= line.time && (!isNext || currentTime < isNext.time);
                    
                    return (
                      <div key={idx} className={isActive ? 'active-lyric' : ''} style={{
                        fontSize: isMobile ? '28px' : '36px',
                        fontWeight: '800',
                        color: isActive ? 'white' : 'rgba(255,255,255,0.4)',
                        transition: 'color 0.3s',
                        filter: isActive ? 'none' : 'blur(1px)'
                      }}>
                        {line.text || '...'}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <pre style={{ 
                  whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: isMobile ? '28px' : '36px', 
                  lineHeight: '1.4', margin: 0, color: 'white', fontWeight: '700', paddingBottom: '100px' 
                }}>
                  {lyrics}
                </pre>
              )}
            </div>
          )}
          </div>{/* close inner container */}
        </div>
      </>
    );
  }

  // ===== MINI PLAYER (default) =====
  return (
    <>
      <audio ref={audioRef} preload="auto" playsInline
        onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleLoadedMetadata} onEnded={handleEnded}
        onWaiting={() => { if (isPlaying) setIsBuffering(true); }}
        onPlaying={() => setIsBuffering(false)} onCanPlay={() => setIsBuffering(false)}
        onError={() => setIsBuffering(false)}
      />
      {currentTrack && !currentTrack.isLocal && !streamUrl && resolvedYtId && (
        <YouTube 
          videoId={resolvedYtId}
          opts={{ height: '0', width: '0', playerVars: { autoplay: 1, controls: 0, disablekb: 1, fs: 0, modestbranding: 1, playsinline: 1 } }}
          onReady={onYtReady}
          onStateChange={onYtStateChange}
          onError={() => { setIsBuffering(false); playNext(); }}
        />
      )}

      <div className="player-container" style={{
        height: isMobile ? '60px' : '90px',
        backgroundColor: isMobile ? '#181818' : 'var(--bg-base)',
        borderTop: '1px solid #282828',
        display: 'flex', alignItems: 'center',
        padding: isMobile ? '0 12px' : '0 16px',
        justifyContent: 'space-between',
        position: 'relative', zIndex: 300
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={() => onTouchEndAction('mini')}
      >
        {/* Mobile progress line at top */}
        {isMobile && currentTrack && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', backgroundColor: 'rgba(255,255,255,0.1)' }}>
            <div style={{ height: '100%', width: `${progressPercent}%`, backgroundColor: '#1ed760', transition: 'width 0.5s linear' }} />
          </div>
        )}

        {/* Track Info - clickable to expand */}
        <div 
          className="player-track-info" 
          onClick={() => { if (currentTrack) setExpanded(true); }}
          style={{ width: isMobile ? '50%' : '30%', display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '14px', minWidth: 0, cursor: 'pointer' }}
        >
          {currentTrack ? (
            <>
              <img src={currentTrack.artworkUrl100} alt={currentTrack.trackName} style={{ width: isMobile ? '42px' : '56px', height: isMobile ? '42px' : '56px', borderRadius: '4px', objectFit: 'cover', flexShrink: 0 }} />
              <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
                <div className="track-name" style={{ color: 'var(--text-base)', fontSize: isMobile ? '13px' : '14px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentTrack.trackName}
                </div>
                <div className="track-artist" style={{ color: 'var(--text-subdued)', fontSize: isMobile ? '11px' : '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentTrack.artistName}
                </div>
              </div>
            </>
          ) : (
            <div style={{ color: 'var(--text-subdued)', fontSize: '13px' }}>Select a track</div>
          )}
        </div>

        {/* Mini Player Controls */}
        <div className="player-main-controls" style={{ width: isMobile ? '50%' : '40%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="control-buttons" style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '24px', marginBottom: isMobile ? '0' : '8px' }}>
            {!isMobile && (
              <button className="btn-icon" onClick={() => setIsShuffle(!isShuffle)}>
                <Shuffle size={20} color={isShuffle ? '#1ed760' : 'currentColor'} />
              </button>
            )}
            <button className="btn-icon" onClick={playPrev} style={{ minWidth: '36px', minHeight: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SkipBack size={isMobile ? 20 : 24} color="white" />
            </button>
            
            <button onClick={togglePlay} style={{
              width: isMobile ? '36px' : '32px', height: isMobile ? '36px' : '32px',
              backgroundColor: 'white', color: 'black',
              borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center',
              border: 'none', cursor: 'pointer', flexShrink: 0
            }}>
              {isBuffering ? (
                <div style={{ width: '16px', height: '16px', border: '2px solid transparent', borderTopColor: 'black', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
              ) : isPlaying ? (
                <Pause size={16} fill="currentColor" />
              ) : (
                <Play size={16} fill="currentColor" style={{ marginLeft: '2px' }} />
              )}
            </button>
            
            <button className="btn-icon" onClick={playNext} style={{ minWidth: '36px', minHeight: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SkipForward size={isMobile ? 20 : 24} color="white" />
            </button>
            {!isMobile && (
              <button className="btn-icon" onClick={() => setIsRepeat(!isRepeat)}>
                <Repeat size={20} color={isRepeat ? '#1ed760' : 'currentColor'} />
              </button>
            )}
          </div>
          
          {/* Desktop Progress Bar */}
          {!isMobile && (
            <div className="progress-bar" style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', maxWidth: '600px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-subdued)', minWidth: '35px', textAlign: 'right' }}>{formatTime(currentTime)}</span>
              <input type="range" min="0" max="100" value={progressPercent} onChange={handleSeek}
                style={{ flex: 1, height: '4px', accentColor: 'var(--text-bright-accent)' }} />
              <span style={{ fontSize: '11px', color: 'var(--text-subdued)', minWidth: '35px' }}>{formatTime(durationSecs)}</span>
            </div>
          )}
        </div>

        {/* Desktop Extra Controls */}
        {!isMobile && (
          <div className="player-extra-controls" style={{ width: '30%', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
            {currentTrack && !currentTrack.isLocal && (
              <Mic2 size={16} color={showLyrics ? '#1ed760' : 'var(--text-subdued)'} cursor="pointer" onClick={toggleLyrics} />
            )}
            <ListMusic size={16} color={showQueue ? '#1ed760' : 'var(--text-subdued)'} cursor="pointer" onClick={() => { setShowQueue(!showQueue); setShowLyrics(false); }} />
            <div onClick={toggleLike} style={{ cursor: 'pointer' }}>
              {isLiked ? <Heart size={16} fill="#1ed760" color="#1ed760" /> : <Heart size={16} color="var(--text-subdued)" />}
            </div>
            <Volume2 size={20} className="text-subdued" />
            <input type="range" min="0" max="100" value={volume * 100} onChange={handleVolumeChange}
              style={{ width: '90px', height: '4px', accentColor: 'var(--text-base)' }} />
          </div>
        )}
      </div>

      {/* Desktop Queue Panel */}
      {!isMobile && showQueue && (
        <div style={{ position: 'fixed', bottom: '90px', right: '0', width: '320px', height: '480px', backgroundColor: '#282828', borderRadius: '8px 0 0 0', padding: '0', overflowY: 'auto', color: 'white', zIndex: 1000, boxShadow: '0 -4px 15px rgba(0,0,0,0.5)' }}>
          <div style={{ position: 'sticky', top: 0, backgroundColor: 'rgba(40,40,40,0.95)', backdropFilter: 'blur(10px)', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10, borderBottom: '1px solid #3e3e3e' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Up Next</h3>
            <button onClick={() => setShowQueue(false)} style={{ background: 'none', border: 'none', color: 'var(--text-subdued)', cursor: 'pointer' }}><X size={20} /></button>
          </div>
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Now Playing Section */}
            {currentTrack && (
              <div>
                <h4 style={{ fontSize: '14px', color: 'var(--text-subdued)', fontWeight: '600', marginBottom: '12px', margin: 0 }}>Now Playing</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.1)' }}>
                  <div style={{ position: 'relative' }}>
                    <img src={currentTrack.artworkUrl100} style={{ width: '40px', height: '40px', borderRadius: '4px' }} />
                    {isPlaying && (
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: '4px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2px' }}>
                        <div className="eq-bar" style={{ height: '14px' }} />
                        <div className="eq-bar" style={{ height: '18px' }} />
                        <div className="eq-bar" style={{ height: '14px' }} />
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#1ed760', fontSize: '14px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentTrack.trackName}</div>
                    <div style={{ color: 'var(--text-subdued)', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentTrack.artistName}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Next In Queue Section */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '14px', color: 'var(--text-subdued)', fontWeight: '600', margin: 0 }}>Next In Queue</h4>
                {queue && queue.length > queueIndex + 1 && (
                  <button onClick={clearQueue} style={{ background: 'none', border: 'none', color: 'var(--text-subdued)', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }} onMouseEnter={e => e.currentTarget.style.color = 'white'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-subdued)'}>Clear</button>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {queue && queue.slice(queueIndex + 1, queueIndex + 50).map((track, i) => {
                  const actualIdx = queueIndex + 1 + i;
                  return (
                    <div key={i} onClick={() => { playTrackFromQueue(actualIdx); setShowQueue(false); }} className="queue-item" style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '8px', borderRadius: '4px' }} onMouseEnter={e => { e.currentTarget.style.backgroundColor='rgba(255,255,255,0.1)'; e.currentTarget.querySelector('.queue-remove-btn').style.opacity = '1'; }} onMouseLeave={e => { e.currentTarget.style.backgroundColor='transparent'; e.currentTarget.querySelector('.queue-remove-btn').style.opacity = '0'; }}>
                      <img src={track.artworkUrl100} style={{ width: '40px', height: '40px', borderRadius: '4px' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: 'white', fontSize: '14px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.trackName}</div>
                        <div style={{ color: 'var(--text-subdued)', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.artistName}</div>
                      </div>
                      <button className="queue-remove-btn" onClick={(e) => removeFromQueue(actualIdx, e)} style={{ background: 'none', border: 'none', color: 'var(--text-subdued)', cursor: 'pointer', opacity: 0, transition: 'opacity 0.2s', padding: '4px' }} onMouseEnter={e => e.currentTarget.style.color = '#ff4d4d'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-subdued)'}>
                        <X size={16} />
                      </button>
                    </div>
                  );
                })}
                {(!queue || queue.length <= queueIndex + 1) && (
                  <div style={{ color: 'var(--text-subdued)', fontSize: '14px', padding: '8px' }}>No upcoming tracks.</div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Desktop Lyrics Panel */}
      {!isMobile && showLyrics && (
        <div style={{ position: 'fixed', bottom: '90px', right: '0', width: '300px', height: '400px', backgroundColor: '#282828', borderRadius: '8px 0 0 0', padding: '16px', overflowY: 'auto', color: 'white', zIndex: 1000, boxShadow: '0 -4px 15px rgba(0,0,0,0.5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>Lyrics</h3>
            <button onClick={() => setShowLyrics(false)} style={{ background: 'none', border: 'none', color: 'var(--text-subdued)', cursor: 'pointer' }}><X size={20} /></button>
          </div>
          <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>{lyrics}</pre>
        </div>
      )}
    </>
  );
};

export default Player;
