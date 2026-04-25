import ytSearch from 'yt-search';

async function test() {
  const result = await ytSearch({ query: 'The Weeknd', pages: 3 });
  console.log("Videos:", result.videos.length);
}
test();
