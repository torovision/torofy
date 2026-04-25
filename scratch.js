import ytSearch from 'yt-search';
ytSearch('The Weeknd audio').then(r => console.log(r.videos[0].url));
