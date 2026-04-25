import ytSearch from 'yt-search';

async function test() {
  const result = await ytSearch({ search: 'The Weeknd', pageStart: 1, pageEnd: 3 });
  console.log("Total videos found:", result.videos.length);
}

test();
