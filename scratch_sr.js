import YouTube from 'youtube-sr';

async function test() {
  const videos = await YouTube.search("The Weeknd", { limit: 50 });
  console.log("Total youtube-sr videos:", videos.length);
}

test();
