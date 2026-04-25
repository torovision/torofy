import { API_URL } from './config';
import { get, set, del } from 'idb-keyval';

export const isTrackOffline = async (trackId) => {
  const offlineTracks = JSON.parse(localStorage.getItem('torofy_offlineTracks')) || [];
  return offlineTracks.some(t => t.trackId === trackId);
};

export const getOfflineTracks = () => {
  return JSON.parse(localStorage.getItem('torofy_offlineTracks')) || [];
};

export const downloadTrack = async (track, quality = 'high') => {
  if (await isTrackOffline(track.trackId)) return true;
  
  const query = track.url ? track.url : `${track.trackName} ${track.artistName} audio`;
  const proxyUrl = `${API_URL}/api/proxy-audio?query=${encodeURIComponent(query)}&quality=${quality}`;

  try {
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error('Download failed');
    
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    await set(`offline-audio-${track.trackId}`, arrayBuffer);
    
    const offlineTracks = getOfflineTracks();
    // Prevent duplicates
    if (!offlineTracks.some(t => t.trackId === track.trackId)) {
      offlineTracks.push({
        ...track,
        downloadedAt: Date.now()
      });
      localStorage.setItem('torofy_offlineTracks', JSON.stringify(offlineTracks));
    }
    
    return true;
  } catch (error) {
    console.error('Failed to download track:', error);
    alert(`Download Error: ${error.message}`);
    return false;
  }
};

export const removeOfflineTrack = async (trackId) => {
  try {
    await del(`offline-audio-${trackId}`);
    
    let offlineTracks = getOfflineTracks();
    offlineTracks = offlineTracks.filter(t => t.trackId !== trackId);
    localStorage.setItem('torofy_offlineTracks', JSON.stringify(offlineTracks));
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};

export const getOfflineStreamUrl = async (trackId) => {
  try {
    const data = await get(`offline-audio-${trackId}`);
    if (data) {
      const blob = data instanceof Blob ? data : new Blob([data], { type: 'audio/mp4' });
      return URL.createObjectURL(blob);
    }
  } catch (e) {
    console.error('Error reading indexeddb', e);
  }
  return null;
};
