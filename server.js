import express from 'express';
import cors from 'cors';
import ytSearch from 'yt-search';
import { exec, spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import lyricsFinder from 'lyrics-finder';
import axios from 'axios';
import http from 'http';
import https from 'https';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());

// Serve the production build (dist/) as static files
app.use(express.static(path.join(__dirname, 'dist')));

const ytdlpBinary = os.platform() === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
const ytdlpPath = path.resolve(`node_modules/youtube-dl-exec/bin/${ytdlpBinary}`);

function getChannelVideos(channelUrl) {
  return new Promise((resolve) => {
    exec(`"${ytdlpPath}" --js-runtimes node -J --flat-playlist --playlist-end 100 "${channelUrl}/videos"`, { maxBuffer: 1024 * 1024 * 10 }, (err, stdout) => {
      if (err) return resolve([]);
      try {
        const data = JSON.parse(stdout);
        const videos = data.entries.filter(v => v.id).map(v => ({
          trackId: v.id,
          trackName: v.title,
          artistName: v.uploader || 'Unknown',
          artworkUrl100: v.thumbnails && v.thumbnails.length > 0 ? v.thumbnails[v.thumbnails.length - 1].url : 'https://via.placeholder.com/300',
          trackTimeMillis: (v.duration || 0) * 1000,
          url: v.url || `https://www.youtube.com/watch?v=${v.id}`
        }));
        resolve(videos);
      } catch (e) {
        resolve([]);
      }
    });
  });
}

app.get('/api/stream', async (req, res) => {
  const query = req.query.query;
  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    let videoUrl = query;
    let title = 'Direct Stream';

    if (!query.startsWith('http')) {
      const searchResult = await ytSearch(query + ' audio');
      const videos = searchResult.videos;
      if (videos.length === 0) {
        return res.status(404).json({ error: 'Song not found' });
      }
      videoUrl = videos[0].url;
      title = videos[0].title;
    }

    console.log(`Streaming audio for: ${title}`);

    // Bypass YouTube bot checks using Android/Web client combination and force direct streams
    const quality = req.query.quality === 'low' ? 'worstaudio/worst' : 'bestaudio/best';
    const cmd = `"${ytdlpPath}" --extractor-args "youtube:player_client=android,web" --js-runtimes node --no-warnings --get-url -f "${quality}" "${videoUrl}"`;

    exec(cmd, { timeout: 30000 }, async (error, stdout, stderr) => {
      if (error) {
        console.error('yt-dlp error:', stderr || error.message);
        return res.status(500).json({ error: 'Failed to extract stream URL' });
      }

      const streamUrl = stdout.trim().split('\n')[0];
      if (!streamUrl || !streamUrl.startsWith('http')) {
        return res.status(500).json({ error: 'Invalid Stream URL returned' });
      }

      console.log(`Proxying Google Video CDN Stream...`);
      
      try {
        const headers = {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        };
        if (req.headers.range) {
          headers['Range'] = req.headers.range;
        }

        const httpAgent = new http.Agent({ family: 4 });
        const httpsAgent = new https.Agent({ family: 4 });

        const response = await axios({
          url: streamUrl,
          method: 'GET',
          responseType: 'stream',
          headers: headers,
          httpAgent,
          httpsAgent,
          validateStatus: status => status >= 200 && status < 400
        });

        res.status(response.status);
        for (const [key, value] of Object.entries(response.headers)) {
          // Prevent setting duplicate chunked encoding headers
          if (key.toLowerCase() !== 'transfer-encoding') {
            res.setHeader(key, value);
          }
        }
        res.setHeader('Content-Type', 'audio/mp4');
        response.data.pipe(res);
      } catch (proxyError) {
        console.error('Proxy Error:', proxyError);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to proxy stream' });
        }
      }
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/proxy-audio', async (req, res) => {
  const query = req.query.query;
  const quality = req.query.quality === 'low' ? 'worstaudio[ext=m4a]/worstaudio/worst' : 'bestaudio[ext=m4a]/bestaudio/best';
  if (!query) return res.status(400).json({ error: 'Query is required' });

  try {
    let videoUrl = query;
    if (!query.startsWith('http')) {
      const searchResult = await ytSearch(query + ' audio');
      if (searchResult.videos.length === 0) return res.status(404).json({ error: 'Not found' });
      videoUrl = searchResult.videos[0].url;
    }

    console.log(`Proxying Audio Download for: ${videoUrl} (${quality})`);
    res.setHeader('Content-Type', 'audio/mp4');
    res.setHeader('Content-Disposition', 'attachment; filename="track.m4a"');
    
    // Spawn yt-dlp and pipe stdout directly to the response
    // MUST use -q to prevent yt-dlp from polluting the audio stream with text logs!
    const cmd = `"${ytdlpPath}" --extractor-args "youtube:player_client=android,web" --js-runtimes node -q -o - -f "${quality}" "${videoUrl}"`;
    const ytdlpProcess = spawn(cmd, { shell: true });

    ytdlpProcess.stdout.pipe(res);
    
    ytdlpProcess.stderr.on('data', (data) => {
      // Ignore warnings
    });

    ytdlpProcess.on('error', (err) => {
      console.error('Failed to start yt-dlp:', err);
      if (!res.headersSent) res.status(500).end();
    });

  } catch (error) {
    console.error('Proxy error:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/debug', (req, res) => {
  exec(`ls -la node_modules/youtube-dl-exec/bin && "${ytdlpPath}" --version`, (err, stdout, stderr) => {
    res.json({
      platform: os.platform(),
      path: ytdlpPath,
      stdout: stdout,
      stderr: stderr,
      err: err ? err.message : null
    });
  });
});

app.get('/api/get-yt-id', async (req, res) => {
  const query = req.query.query;
  if (!query) return res.status(400).json({ error: 'Query is required' });

  try {
    const searchResult = await ytSearch(query + ' audio');
    const videos = searchResult.videos;
    if (videos.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }
    res.json({ videoId: videos[0].videoId });
  } catch (error) {
    console.error('Failed to get yt id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: 'Query is required' });

  try {
    const [res1, res2, res3] = await Promise.all([
      ytSearch(query),
      ytSearch(query + ' official audio'),
      ytSearch(query + ' music video')
    ]);
    
    // Merge and remove duplicates
    const allVideos = [...res1.videos, ...res2.videos, ...res3.videos];
    const uniqueVideos = [];
    const ids = new Set();
    for (const v of allVideos) {
      if (!ids.has(v.videoId)) {
        ids.add(v.videoId);
        uniqueVideos.push(v);
      }
    }

    const videos = uniqueVideos.map(v => ({
      trackId: v.videoId,
      trackName: v.title,
      artistName: v.author.name,
      artworkUrl100: v.thumbnail,
      trackTimeMillis: v.duration.seconds * 1000,
      url: v.url
    }));
    const channels = res1.channels ? res1.channels.map(c => ({
      name: c.name,
      image: c.image,
      url: c.url,
      subCountLabel: c.subCountLabel
    })) : [];

    res.json({ results: videos, channels });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/artist', async (req, res) => {
  const name = req.query.name;
  if (!name) return res.status(400).json({ error: 'Artist name required' });

  try {
    // 1. Fetch channel/avatar
    const channelSearch = await ytSearch(`${name} official channel`);
    const channel = channelSearch.channels && channelSearch.channels.length > 0 ? channelSearch.channels[0] : null;

    // 2. Fetch popular tracks and playlists
    let popularTracks = [];
    if (channel && channel.url) {
      // Fetch all recent music from their actual channel using yt-dlp
      popularTracks = await getChannelVideos(channel.url);
    }
    
    // Fallback if yt-dlp fails or channel not found
    if (popularTracks.length === 0) {
      const [res1, res2] = await Promise.all([
        ytSearch(name),
        ytSearch(name + ' official music')
      ]);
      
      const allVideos = [...res1.videos, ...res2.videos];
      const uniqueVideos = [];
      const ids = new Set();
      for (const v of allVideos) {
        if (!ids.has(v.videoId)) {
          ids.add(v.videoId);
          uniqueVideos.push(v);
        }
      }

      popularTracks = uniqueVideos.map(v => ({
        trackId: v.videoId,
        trackName: v.title,
        artistName: v.author.name,
        artworkUrl100: v.thumbnail,
        trackTimeMillis: v.duration.seconds * 1000,
        url: v.url
      }));
    }

    // Fetch playlists (we still use ytSearch for this since it's fast)
    const playlistSearch = await ytSearch(name + ' playlist');
    const playlists = playlistSearch.playlists ? playlistSearch.playlists.slice(0, 10).map(p => ({
      id: p.listId,
      title: p.title,
      author: p.author.name,
      image: p.image,
      videoCount: p.videoCount
    })) : [];

    res.json({
      artistInfo: {
        name: channel ? channel.name : name,
        image: channel ? channel.image : 'https://via.placeholder.com/300?text=No+Image',
        subscribers: channel ? channel.subCountLabel : 'Unknown',
        url: channel ? channel.url : ''
      },
      popularTracks,
      playlists
    });
  } catch (error) {
    console.error('Artist fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/lyrics', async (req, res) => {
  const artist = req.query.artist || '';
  const title = req.query.title || '';
  try {
    // Primary: lrclib.net (highly reliable and often has synced lyrics)
    const response = await axios.get(`https://lrclib.net/api/search?q=${encodeURIComponent(artist + ' ' + title)}`);
    if (response.data && response.data.length > 0) {
      // Find the first result that has plainLyrics or syncedLyrics
      const track = response.data.find(t => t.plainLyrics || t.syncedLyrics);
      if (track) {
        return res.json({ 
          lyrics: track.plainLyrics,
          syncedLyrics: track.syncedLyrics
        });
      }
    }
    
    // Fallback to lyrics-finder package
    let lyrics = await lyricsFinder(artist, title);
    if (lyrics) {
      return res.json({ lyrics });
    }
    
    res.json({ lyrics: "Lyrics not found." });
  } catch (error) {
    console.error('Lyrics fetch error:', error.message);
    res.json({ lyrics: "Error fetching lyrics." });
  }
});

app.get('/api/download', async (req, res) => {
  const url = req.query.url;
  const title = req.query.title || 'download';
  if (!url) return res.status(400).json({ error: 'URL required' });

  try {
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(title)}.m4a"`);
    res.setHeader('Content-Type', 'audio/mp4');

    // Use best m4a audio without conversion to avoid ffmpeg requirement
    const subprocess = spawn(ytdlpPath, [
      '--js-runtimes', 'node',
      '-f', 'bestaudio[ext=m4a]/bestaudio',
      '-o', '-',
      '-q',
      '--no-warnings',
      '--no-playlist',
      url
    ]);

    subprocess.stdout.pipe(res);

    subprocess.stderr.on('data', (data) => {
      console.error(`yt-dlp download stderr: ${data}`);
    });

    subprocess.on('close', (code) => {
      if (code !== 0) {
        console.error(`yt-dlp download process exited with code ${code}`);
      }
    });
  } catch (error) {
    console.error('Download error:', error);
    if (!res.headersSent) res.status(500).send('Download failed');
  }
});

app.get('/api/proxy-image', async (req, res) => {
  const imageUrl = req.query.url;
  if (!imageUrl) return res.status(400).send('URL required');
  try {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    res.set('Content-Type', response.headers['content-type']);
    res.set('Cache-Control', 'public, max-age=31536000');
    res.send(response.data);
  } catch (error) {
    res.status(500).send('Error fetching image');
  }
});

// SPA catch-all: serve index.html for any non-API route (React Router support)
app.get('/{path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`ToroFy running on http://0.0.0.0:${PORT}`);
});
