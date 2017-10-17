const PlaylistCreator = require('./PlaylistCreator.js');

const message = {
    author: {
        id: '1234',
        username: "testAccount"
    }
}

const playlistCreator = new PlaylistCreator();

var args = ['start'];
playlistCreator.onMessage(message, args);

var args = ['newPlaylist', 'Dance'];
playlistCreator.onMessage(message, args);

var args = ['add', "numb"];
playlistCreator.onMessage(message, args);

var args = ['add', "in the end"];
playlistCreator.onMessage(message, args);

setTimeout(() => {
    var args = ['switchPosition', '1', '2'];
    playlistCreator.onMessage(message, args);

    var args = ['remove', '1'];
    playlistCreator.onMessage(message, args);

    var args = ['finish'];
    playlistCreator.onMessage(message, args);
}, 5000);




