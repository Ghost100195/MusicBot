const Discord = require("discord.js");
const { drawBox, drawLine, drawList } = require('./OutputFormer.js');
const Embed = require('./ReactionEmbed');


function createRichEmbed(){
    const embed = new Embed();
    const content = [{content: "Hello World", symbole:"1⃣" }, 
                    {content: "Hello World", symbole:"2⃣" }, 
                    {content: "Hello World", symbole:"3⃣" }];
        
    const playlist = [{content: "Numb", symbole:"1"},
                        {content: "In the end", symbole:"2"}];
    embed
    .setColor("GREEN")
    .setAuthor("DjBotto", "https://www.shareicon.net/download/2017/06/21/887435_logo_512x512.png")
    .setTitle("Playlist Bearbeitung")
    .setDescription("Du befindest dich im Menü")
    .addList("Funktionen", content, 30)
    .addBlankField()
    .addList("Deine Playlisten", playlist, 30)
    .addBlankField()
    .addStatus("Bitte wählen sie eine Aktion mittels klick auf den entsprechenden Emoji .. ");
    return embed;
}

module.exports = {createRichEmbed};

/**
 *   message.reply(createPlaylistMenu())
    .then((msg) => {
      const reactArray = ['1⃣','2⃣', '3⃣', '4⃣'];
      reactArray.forEach((emoji) => msg.react(emoji));

      
      const collector = msg.createReactionCollector((reaction, user) => {
        if(!user.bot){
          if(reactArray.includes(reaction.emoji.name)){
            console.log(reaction.emoji);
          }
          msg.delete();
          collector.stop()
          sendMessage();
        }
      });
      
      collector.on('collect', r => console.log(`Collected ${r.emoji.name}`));
      collector.on('end', collected => console.log(`Collected ${collected.size} items`));
    
    }).catch((err) => {
      console.log("err");
    });
 */