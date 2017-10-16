const request = require('request');
const getYoutubeID = require('get-youtube-id');
const fetchVideoInfo = require("youtube-info");
const ytdl = require('ytdl-core');

const YT_API_KEY = "";
const STREAM_SETTING =  {filter: 'audioonly'};
const YOUTUBE_PREFIX = "https://www.youtube.com/watch?v=";

function getYoutubeSong(term, callback){
    if(_isYoutube(term)){
        // eine Youtube-URL erhalten
        const id = getYoutubeID(term);
        _getDetails(id, callback);
    }else{
        // Suchbegriffe erhalten
        _searchVideo(term, (id) => {
            _getDetails(id, callback);
        });
    }
}


function _getDetails(id, callback){
    if(!id || id === null) {
        callback("", "", "Lied nicht gefunden");
        return;
    }

    fetchVideoInfo(id, (err, videoInfo) => {
        if(err){
            console.log(err);
        }

        if(!videoInfo){
            callback("", "", "Keine zusätzlichen Informationen zum Lied gefunden");
            return;
        }
        callback(id, videoInfo, err);
    });
}


function _isYoutube(term){
    return term.toLowerCase().indexOf("youtube.com") > -1;
}

function _searchVideo(term, callback){
    const youtubeAPI = "https://www.googleapis.com/youtube/v3/search?part=id&type=video&";
    request(`${youtubeAPI}${"q="+encodeURIComponent(term)}${"&key="+YT_API_KEY}`,(error, response, body) => {
      if(error) console.log(error);
      var json = JSON.parse(body);
      if(json.items[0]){
        callback(json.items[0].id.videoId);
      }else{
        callback(null);
      }
    });
}

function getYoutubeStream(id){
    return ytdl(YOUTUBE_PREFIX + id, STREAM_SETTING);
}

module.exports = {getYoutubeSong, getYoutubeStream};