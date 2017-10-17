const fs = require('fs');
const dir = './module/playlist/lists/';

const publicFile = './lists/public.json';

function load(userID, playlistName){
    if(fs.existsSync(`${dir}${userID}/${playlistName}.json`)){
        return require(`./lists/${userID}/${playlistName}`).playlist;
    }else{
        return null;
    }
}

function rename(userID, playlistName, newName){
    fs.rename(`${dir}${userID}/${playlistName}.json`, `${dir}${userID}/${newName}.json`, (err) => {
        if(err) console.warn(err);
    });
}

function save(userID, { playlist_name, playlist }){
    if(!fs.existsSync(`${dir}${userID}`)) fs.mkdirSync(`${dir}${userID}`);
    var obj = {playlist};

    fs.writeFile(`${dir}${userID}/${playlist_name}.json`, JSON.stringify(obj, null, 2), (err) => {
        if(err) console.warn(err);
    });
}

function deletePlaylist(userID, playlistName){
    if(fs.existsSync(`${dir}${userID}/${playlistName}.json`)){
        fs.unlink(`${dir}${userID}/${playlistName}.json`, (err) => {
            if(err) console.warn(err);
        });
        return true;
    }

    return false;
}

function saveToPublic(userID, playlistName){
    const file = require(publicFile);
    file[userID] = {
        playlistName,
        pfad: `./lists/${userID}/${playlistName}`
    };

    fs.writeFile(`${dir}/public.json`, JSON.stringify(file, null, 2), (err) => {
        if(err) console.warn(err);
    });
}

function readPlaylistNames(userID){
    const result = [];
    fs.readdirSync(`${dir}${userID}`).forEach(file => {
        result.push(file.replace(".json", ""));
    });
    return result;
}

module.exports = {
 save, load, saveToPublic, deletePlaylist, readPlaylistNames, renameFile: rename
};