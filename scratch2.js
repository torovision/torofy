import play from 'play-dl';
play.stream('https://youtube.com/watch?v=rsEne1ZiQrk').then(s => console.log(s.type)).catch(e => console.error(e));
