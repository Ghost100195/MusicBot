const { createBox } = require('./OutputFormer.js');

function createRichEmbed(){
    const embed = new Discord.RichEmbed();
    embed
    .setColor("GREEN")
    .setTitle("Playlist")
    .setDescription("```"+ drawBox({content: "hello World", padding: 10}) + "```");
    return {embed};
}

function createLogikMenu(collection){
    
}

module.exports = {createRichEmbed};