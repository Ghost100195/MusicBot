const NO_PERMISSION = ["help"];
const NORMAL_PERMISSION = ["play", "skip", "join", "list", "save", "load", "rec"];
const CONTROLLER_PERMISSION = ["del", "delall", "ban", "start", "stop", "loop", "shuffle"];


const blacklist = {};

function hasPermission(cmd, message, audioController){
    const voiceChannel = audioController.voiceChannel;
    const botController = audioController.botController;
    const member = message.member;

    if(blacklist[member.id]){
        const timeStamp = new Date().getTime();
        if( timeStamp - blacklist[member.id].startTime >= blacklist[member.id].time){
            delete blacklist[member.id];
        }else{
            return false;
        }   
    }

    if(NO_PERMISSION.includes(cmd)){
        return true;
    }

    if(NORMAL_PERMISSION.includes(cmd)){
        var possible = true;
        
        if(voiceChannel  !== null){
            if(member.voiceChannel !== voiceChannel ){
                possible = false;
            }
        }else{
            if(member !== null && !member.voiceChannel){
                possible = false;
            }
        }
        return possible;
    }

    if(CONTROLLER_PERMISSION.includes(cmd)){
        return botController !== null && member.id === botController.id;
    }
    
    return false;
}

function setOnBlacklist(userID, time, reason){
    blacklist[userID] = {
        time, 
        reason, 
        startTime: new Date().getTime()
    };
}


module.exports  = {
    hasPermission,
    setOnBlacklist 
}