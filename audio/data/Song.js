class Song{
    constructor(id, title, requester, src, url){
        this.id = id;
        this.title = title;
        this.duration = "";
        this.requester = requester;
        this.url = url;
        this.src = src; // spaeter eventuell radio etc.
    }

    static copy(toCopy){
        const song = new Song();
        song.id = toCopy.id;
        song.title = toCopy.title;
        song.duration = toCopy.duration;
        song.requester = toCopy.requester ? toCopy.requester : "";
        song.src = toCopy.src;
        song.url = toCopy.url;
        return song;
    }

    setDuration(sec){
        const min = Math.floor(sec/60);
        var seconds = sec % 60;
        if(seconds/10 < 1) seconds = "0"+seconds;
        this.duration = min+":"+seconds; 
    }

    info(){
        return `** ${this.title} ** (${this.duration})`; 
    }
}

module.exports = Song;