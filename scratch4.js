import ytSearch from 'yt-search';

async function test() {
  // Can we search by channel?
  const channelId = 'UC0WP5P-ufpRfjbNrmOWwLBQ';
  try {
    const list = await ytSearch({ list: channelId }); // this is for playlists
    console.log("Playlist search:", list);
  } catch (e) { console.log(e.message); }
  
  try {
    const opts = { search: 'The weeknd', pageStart: 1, pageEnd: 1 };
    const res = await ytSearch(opts);
    // Does it have playlists?
    console.log("Playlists:", res.playlists.slice(0,1));
    console.log("Playlists length:", res.playlists.length);
  } catch (e) {}
}

test();
