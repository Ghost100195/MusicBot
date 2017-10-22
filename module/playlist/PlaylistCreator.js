const { getYoutubeSong } = require('../audio/source/YtLoader.js');
const { load, save, saveToPublic, deletePlaylist, readPlaylistNames, renameFile } = require('./fileManager.js');
const Song = require('../audio/data/Song.js');

const prefix = "+";

class PlaylistCreator{

    constructor(){
        // userid -> modi -> aktuelle playlist
        this.onWork = {}; 
        this.states = {
            menu: ['list', 'new', 'delete', 'edit', 'rename'],
            edit: ['add', 'remove', 'switch', 'finish', 'show']
        };
        
        this.fnc = {
            start: this.start.bind(this),

            new: this.newPlaylist.bind(this),
            delete: this.deletePlaylist.bind(this),
            edit: this.editing.bind(this),
            list: this.list.bind(this),
            rename: this.rename.bind(this), 

            add: this.add.bind(this),
            remove: this.remove.bind(this),
            switch: this.switchPosition.bind(this),
            finish: this.finishEditing.bind(this), 
            show: this.show.bind(this)
        };
    }

    onMessage({ message }){
        if(this.onWork[message.author.id] && message.channel.type === "dm"){
            const args = message.content.split(/ +/g);
            const cmd = args.shift();  

            if(this.fnc[cmd] && this._allowed(message.author.id, cmd)){
                this.fnc[cmd](message, args);
            }else{
                this._sendAuthorMessage(message, "Dein Commando wurde nicht erkannt oder du befindest dich nicht im PlaylistEdit-Modus!");
            }
            return;
        }else{
            if(message.content.indexOf(prefix) === 0){
                const content = message.content.slice(prefix.length).trim();
                const args = content.split(/ +/g);
                const cmd = args.shift().trim();  

                if(this.fnc[cmd] && cmd === "start"){
                    this.fnc[cmd](message, args);
                }
            }
        }
    }

    start(message, args){
        this.onWork[message.author.id] = {
            modi : "menu",
            playlist_name : "",
            playlist : [], 
            timeInMenu: new Date().getTime()
        }
        this._changeModiToMenu(message.author.id);
        this._sendAuthorMessage(message, this._infoMenu());
    }
    
    newPlaylist(message, args){
        if(!args[0]) {
            this._sendAuthorMessage(message, "Playlistnamen vergessen! Bitte versuche es erneut");
            return;
        }
        this.onWork[message.author.id].playlist_name = args[0];

        this._sendAuthorMessage(message, this._infoEdit(args[0]));
        this._changeModiToEdit(message.author.id);
    }

    deletePlaylist(message, args){
        if(!args[0]) {
            this._sendAuthorMessage(message, "Es wurde kein Playlistname gefunden! Bitte probiere es erneut");
            return;
        }
        if(deletePlaylist(message.author.id, args[0])){
            this._sendAuthorMessage(message, `Die Playlist ${args[0]} wurde erfolgreich gelöscht!`);
        }else{
            this._sendAuthorMessage(message, `Die Playlist ${args[0]} konnte nicht gefunden werden!`);
        }
    }


    editing(message, args){  
        if(!args[0]) {
            this._sendAuthorMessage(message, "Der Playlist name konnte nicht gefunden werden!");
            return;
        }
        this.onWork[message.author.id].playlist = load(message.author.id, args[0]);

        if(this.onWork[message.author.id].playlist !== null){
            this.onWork[message.author.id].playlist_name = args[0];
            this._changeModiToEdit(message.author.id);
            this._sendAuthorMessage(message, this._infoEdit(args[0]));
        }else{
            this.onWork[message.author.id].playlist = [];
            this._sendAuthorMessage(message,"Playlist wurde nicht gefunden!");
        }
    }

    list(message, args){
        const list = readPlaylistNames(message.author.id);
        var answer =    "Folgende Playlist gehören zu deinem Account:\n" +
                        "--------------------------------------------\n";
        if(list.length > 0){
            let i = 1; 
            list.forEach((playlistName) => {
                answer += (i++) + ": " + playlistName + "\n";
            });
        }else{
            answer = "Dein Account besitzt keine Playlists";
        }

        this._sendAuthorMessage(message, answer);
    }

    rename(message, args){
        if(!(args[0] || args[1])){
            this._sendAuthorMessage(message, "Bitte geben Sie den name der Playlist an die umbennant werden soll - sowie den neuen Namen!");
            return;
        }        

        renameFile(message.author.id, args[0], args[1]);
        this._sendAuthorMessage(message, `Die Playlist ${args[0]} wurde erfolgreich in ${args[1]} umbenannt!`);
    }

    // in editing mode
    add(message, args){
        if(!args[0]) {
            this._sendAuthorMessage(message, "Kein Songname gefunden! Bitte probiere es nochmal!");
            return;
        }
        getYoutubeSong(args.join(" "), (songID, details, err) => {
            if(err) console.log(err);

             // init Song Objekt
             const song = new Song(songID, details.title, message.author.username, "youtube", details.url);
             song.setDuration(details.duration);

             this.onWork[message.author.id].playlist.push(song);
             this._sendAuthorMessage(message, `Der Song ${song.info()} wurde hinzugefügt`);
        });
    }

    remove(message, args){
        if(!args[0]) {
            this._sendAuthorMessage(message, "Zum Löschen bitte Position des Songs angeben!");
            return;
        }
        const pos = args[0] - 1;
        if(pos <= this.onWork[message.author.id].playlist.length){
            const removedSong = this.onWork[message.author.id].playlist.splice(pos, 1);
            this._sendAuthorMessage(message, `Der Song ${removedSong[0].info()} wurde entfernt!`);
            return;
        }
        
        this._sendAuthorMessage(message, `Die angegebene Position befindet sich außerhalb der Playlist`);
    }

    show(message, args){
        
        let answer =    "Folgende Lieder befinden sich in deine Playlist: \n------------------------------------------------\n";

        if(this.onWork[message.author.id].playlist.length === 0){
            answer = "Es befinden sich noch keine Lieder in der Playlist";
        }else{
            let i = 1;
            this.onWork[message.author.id].playlist.forEach((song) => {
                answer += (i++) + ": " + Song.copy(song).info() + "\n"; 
            });
        }

        this._sendAuthorMessage(message, answer);
    }

    switchPosition(message, args){
        if(!(args[0] || args[1])){
            this._sendAuthorMessage(message, "Bitte geben Sie die beiden Positionen, die getauscht werden sollen, an");
            return;
        }
        const userID = message.author.id;
        const first = args[0] - 1;
        const second = args[1] - 1;
        
        var tmp = Song.copy(this.onWork[userID].playlist[first]);
        this.onWork[userID].playlist[first] = Song.copy(this.onWork[userID].playlist[second]);
        this.onWork[userID].playlist[second] = tmp;
        this._sendAuthorMessage(message, `Die Songs an Position ${args[0]} und ${args[1]} wurden erfolgreich getauscht!`);
    }

    finishEditing(message, args){
        save(message.author.id, this.onWork[message.author.id]);
        this.onWork[message.author.id].playlist = [];
        this.onWork[message.author.id].playlist_name = "";
        this._changeModiToMenu(message.author.id);
       
        this._sendAuthorMessage(message, `Die Playlist wurde erfolgreich gespeichert! \n` + this._infoMenu());
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
        }, 181*1000)
    }

    setPublic(message, args){
        saveToPublic(message.author.id, this.onWork[message.author.id].playlist_name);
    }

    _changeModiToEdit(userID){
        this.onWork[userID].modi = "edit";
    }

    _changeModiToMenu(userID){
        this.onWork[userID].modi = "menu";
        this._delayRemove(userID);
    }

    _allowed(userID, cmd){
        if(this.onWork[userID]){
            if(this.states.menu.includes(cmd) && this.onWork[userID].modi === "menu") return true;
            if(this.states.edit.includes(cmd) && this.onWork[userID].modi === "edit") return true;
        }

        return false;
    }

    _sendAuthorMessage(message, content){
        message.author.send(content);
    }

    _infoMenu(){
        const Embed = require('../../util/ReactionEmbed');

        const actions = [
            {content: "Neu", symbole:""},
            {content: "Umbennen", symbole:""},
            {content: "Bearbeiten", symbole:""},
            {content: "Löschen", symbole:""}
        ];

        const playlists = readPlaylistNames(); // Die Author ID fehlt hier noch!
        const answer = new Embed()
                        .setColor("GREEN")
                        .setAuthor("DjBotto", "https://www.shareicon.net/download/2017/06/21/887435_logo_512x512.png")
                        .setTitle("Playlist Bearbeitung")
                        .setDescription("Du befindest dich im Menü")
                        .addList("Funktionen", actions, 30)
                        .addBlankField()
                        .addList("Deine Playlisten", playlists, 30)
                        .addBlankField()
                        .addStatus("Bitte wählen sie eine Aktion mittels klick auf den entsprechenden Emoji .. ");

        return (`Du bist nun im Playlist-Edit Modus \n` +
                `--------------------------------------------- \n` +
                `Folgende Funktionen stehen zur Verfügung: \n` +
                `new [name]       -> legt eine neue Playlist an \n` +
                `list             -> eine Liste deiner Playlists \n` +
                `rename           -> Playlist umbenennen \n` +
                `delete [name]    -> Löschen einer Playlist \n` +
                `edit [name]      -> Ändern eine vorhandenen Playlist \n`);
    }

    _infoEdit(playlistname){
        return (`Du befindest dich nun im Edit-Modus für die Playlist ${playlistname} \n`+
                `---------------------------------------------------------------\n`+
                `Folgende Funktionen stehen zur Verfügung: \n`+
                `add [url oder Suchbegriff] \n`+
                `remove [Position des Liedes] \n`+
                `show \n`+
                `switch [Position1, Position 2]\n`+
                `** AM ENDE MIT 'FINISH' SPEICHERN! **`);
    }

    connect(subscribe){
        subscribe("message", this.onMessage.bind(this));
    }
}

module.exports = PlaylistCreator;