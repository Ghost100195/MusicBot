const { getYoutubeSong } = require('../source/YtLoader.js');
const { load, save, saveToPublic, deletePlaylist, readPlaylistNames, renameFile } = require('./fileManager.js');
const Song = require('../data/Song.js');

class PlaylistCreator{

    constructor(){
        // userid -> modi -> aktuelle playlist
        this.onWork = {}; 
        this.states = {
            menu: ['list', 'newPlaylist', 'deletePlaylist', 'editing', 'rename'],
            edit: ['add', 'remove', 'switchPosition', 'finish']
        };

        // modis = menu, edit
        /*
            finishEditing or start() get in menu mode
            menu = 
                list
                newPlaylist
                deletePlaylist
                editing
                 rename
        */ 

        /*
            editing() or newPlaylist() get in edit mode
            edit = 
                add
                remove
                switchPosition
                finish

                public or not
               
        */

        this.fnc = {
            start: this.start.bind(this),
            newPlaylist: this.newPlaylist.bind(this),
            deletePlaylist: this.deletePlaylist.bind(this),
            editing: this.editing.bind(this),
            list: this.list.bind(this),
            add: this.add.bind(this),
            remove: this.remove.bind(this),
            switchPosition: this.switchPosition.bind(this),
            finish: this.finishEditing.bind(this), 
            rename: this.rename.bind(this), 
        
        };
    }

    onMessage(message, args){
        const cmd = args.shift();
        
        if(this.fnc[cmd] && this._allowed(message.author.id, cmd)){
            this.fnc[cmd](message, args);
        }else{
            console.log("No access");
        }
    }

    start(message, args){
        this.onWork[message.author.id] = {
            modi : "menu",
            playlist_name : "",
            playlist : [], 
            timeInMenu: new Date().getTime()
        }
        this._delayRemove(message.author.id);
    }
    
    newPlaylist(message, args){
        if(!args[0]) {
            console.log("Name vergessen");
            return;
        }
        this.onWork[message.author.id].playlist_name = args[0];
        this._changeModiToEdit(message.author.id);
    }

    deletePlaylist(message, args){
        if(!args[0]) {
            console.log("Choose a Playlist to delete! Missing Name");
            return;
        }
        deletePlaylist(message.author.id, args[0]);
    }

    editing(message, args){  
        if(!args[0]) {
            console.log("Choose a playlist to editing");
            return;
        }
        this.onWork[message.author.id].playlist = load(message.author.id, args[0]);
        this.onWork[message.author.id].playlist_name = args[0];
        this._changeModiToEdit(message.author.id);
    }

    list(message, args){
        const list = readPlaylistNames(message.author.id);
        if(list.length > 0){
            // create a list
        }else{
            // send message no playlist
        }
    }

    rename(message, args){
        if(!(args[0] || args[1])){
            console.log("Unable to rename");
            return;
        }        

        renameFile(message.author.id, args[0], args[1]);
    }

    // in editing mode
    add(message, args){
        if(!args[0]) {
            console.log("Need name of song");
            return;
        }
        getYoutubeSong(args[0], (songID, details, err) => {
            if(err) console.log(err);

             // init Song Objekt
             const song = new Song(songID, details.title, message.author.username, "youtube", details.url);
             song.setDuration(details.duration);

             this.onWork[message.author.id].playlist.push(song);
        });
    }

    remove(message, args){
        if(!args[0]) {
            console.log("position of song undefined");
            return;
        }
        const pos = args[0] - 1;
        if(pos <= this.onWork[message.author.id].playlist.length){
            this.onWork[message.author.id].playlist.splice(pos, 1);
            console.log("removed");
            return;
        }
        
        console.log("pos out of playlistlength");
    }

    switchPosition(message, args){
        if(!(args[0] || args[1])){
            console.log("positions not defined for switching");
            return;
        }
        const userID = message.author.id;
        const first = args[0] - 1;
        const second = args[1] - 1;
        
        var tmp = Song.copy(this.onWork[userID].playlist[first]);
        this.onWork[userID].playlist[first] = Song.copy(this.onWork[userID].playlist[second]);
        this.onWork[userID].playlist[second] = tmp;
    }

    finishEditing(message, args){
        save(message.author.id, this.onWork[message.author.id]);
        this.onWork[message.author.id].playlist = [];
        this.onWork[message.author.id].playlist_name = "";
        this._changeModiToMenu(message.author.id);
        this._delayRemove(message.author.id);
    }

    _delayRemove(userID){
        this.onWork[userID].timeInMenu = new Date().getTime();
        setTimeout(() => {
            const time = new Date().getTime();
            if(time - this.onWork[userID].timeInMenu > 180*1000){
                if(this.onWork[userID].modi === "menu"){
                    delete this.onWork[userID];
                }
            }
        })
    }

    setPublic(message, args){
        saveToPublic(message.author.id, this.onWork[message.author.id].playlist_name);
    }

    _changeModiToEdit(userID){
        this.onWork[userID].modi = "edit";
    }

    _changeModiToMenu(userID){
        this.onWork[userID].modi = "menu";
    }

    _allowed(userID, cmd){
        if(cmd === "start") return true;
        if(this.onWork[userID]){
            if(this.states.menu.includes(cmd) && this.onWork[userID].modi === "menu") return true;
            if(this.states.edit.includes(cmd) && this.onWork[userID].modi === "edit") return true;
        }

        return false;
    }
}

module.exports = PlaylistCreator;