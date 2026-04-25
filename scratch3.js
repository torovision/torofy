import ytSearch from 'yt-search';

async function test() {
  const result = await ytSearch('The Weeknd');
  
  // Look at the first video's thumbnail
  const video = result.videos[0];
  console.log("Video Thumbnail:", video.thumbnail);
  console.log("Video Image:", video.image);
  
  // Look for channels/artists
  const channels = result.channels;
  if (channels && channels.length > 0) {
    const channel = channels[0];
    console.log("\nChannel Info:");
    console.log(channel);
  } else {
    // If no channels in normal search, maybe we have to do ytSearch.search with a specific type?
    console.log("No channels found in default search.");
  }
}

test();
