const fs = require('fs');
const { getYoutubeStream } = require('../source/YtLoader.js');

class AudioPlayer{
    constructor(){
        this.dispatcher = null;
        this.connection = null;

        this.queue = [];
        this.isLooping = false;
        this.isShuffling = false;
    }

    play(connection){
        if(connection) this.connection = connection;

        this.onNextSong(this.queue[0]);
       

        const ytdl_stream = getYoutubeStream(this.queue[0].id);
        this.dispatcher =  this.connection.playStream(ytdl_stream);

        this.dispatcher.on('end', (reason) => {
            this._next();
            if(this.queue.length > 0){
                // play next Song
                // timeout wird benötigt um condition racing zu vermeiden
                setTimeout(() => {
                    
                    this.play(this.connection);
                }, 1000); 
            }else{
                this.dispatcher = null;
                this.onEnd();
            }
        });
    }

    shuffle(bool){
        this.isShuffling = bool;
    }

    loop(bool){
        this.isLooping = bool;
    }

    skip(callback){
        if(this.dispatcher !== null && this.dispatcher.time > 0){
            var song = {};
            Object.assign(song, this.queue[0]);
            this.dispatcher.end();
            callback(song);
        }else{
            setTimeout(this.skip, 1000);
        }
    }

    list(){
        const indend = "```";
        if(this.queue.length > 0){
          var embed ={
            color: 0x00ff00,
            title: "Aktuelle Playlist",
            fields:[]
          };
  
          var i = 1;
          this.queue.forEach((song) => {
            embed.fields.push({
              name : `------------------------------------------------------------------------------`,
              value : `${indend}${i === 1 ? "Aktuelles Lied" : (i - 1)}: ${song.title}${indend}`,
              inline :  false
            });
            i++;
          });

          return embed;
        }

        return null;
    }

    reset(){
        this.queue = [];
        this.isShuffling = false;
        this.isLooping = false;
        this.dispatcher = null;
        this.connection = null;
    }

    end(){
        this.queue = [];
        this.dispatcher.end();
    }

    addSong(song){
        this.queue.push(song);
        if(this.queue.length === 1){
            this.play();
        }
    }

    removeSong(pos){
        if(pos <= this.queue.length && pos > 0){
            var song = this.queue[pos];
            this.queue.splice(pos, 1);
            return song;
        }
    }

    savePlaylist(filename, callback){
        const obj = {};
        var pos = 1;
        this.queue.forEach((song) => {
            obj[pos++] = song;
        });

        console.log(JSON.stringify(obj, null, 2));

        fs.access(`./audio/player/playlists/${filename}.json`, (err) => {
            if(err){
                console.log(err);
                fs.writeFile(`./audio/player/playlists/${filename}.json`, JSON.stringify(obj, null, 2), (err) => {
                    if(err) console.log(err);
                    callback(err);
                });
            }else{
                // Dateiname ist schon vergeben
                // send Message
                callback("Name schon vergeben!");
            }
        });
    }

    loadPlaylist(filename, callback){
        fs.access(`./audio/player/playlists/${filename}.json`, (err) => {
            if(err){
                console.log(err);
                callback(null, err);
                return;
            }
            
            var obj = require(`./playlists/${filename}.json`);
            callback(obj);
        });
    }

    _next(){
        if(this.queue.length === 0) return; // tritt ein sobald end() aufgerufen wird
        const removedSong = this.queue.shift();
        
        if(this.isLooping){
            this.queue.push(removedSong);
        }

        if(this.isShuffling){
            // wahl von max, min in Abhängigkeit ob sich der Player in einer Loop befindet.
            const max = this.isLooping ? this.queue.length - 1 : this.queue.length;
            const min =  0; 

            // Berechnung von der Random zahl zwischen exclusiv max und inclusiv min
            const rnd = Math.floor(Math.random() * (max - min)) + min;
            
            // ausgewählte Lied vorne einfügen
            this.queue.unshift(this.queue.splice(rnd, 1)[0]);
        }
    }

    isActiv(){
        return this.dispatcher !== null;
    }

    setQueue(queue){
        this.queue = queue.slice(0);
    }


    // zum ueberschreiben von außen
    onEnd(){
        console.log("End");
    }

    onNextSong(song){}
}

module.exports = AudioPlayer;