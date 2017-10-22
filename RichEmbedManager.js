const Discord = require("discord.js");
const { drawBox, drawLine, drawList } = require('./OutputFormer.js');

function createRichEmbed(){
    const embed = new Discord.RichEmbed();
    const content = [{content: "Hello World", symbole:"1⃣" }, 
                    {content: "Hello World", symbole:"1⃣" }, 
                    {content: "Hello World", symbole:"1⃣" }];
        
    const playlist = [{content: "Numb", symbole:"1"},
                        {content: "In the end", symbole:"2"}];
    embed
    .setColor("GREEN")
    .setAuthor("DjBotto", "https://www.shareicon.net/download/2017/06/21/887435_logo_512x512.png")
    .setTitle("Playlist Bearbeitung")
    .setDescription("Du befindest dich im Menü")
    .addField("Funktionen", drawLine(30)+ "\n" + drawList(content, 30, true))
    .addBlankField()
    .addField("Deine Playlisten", drawLine(30)+ "\n" + drawList(playlist, 30, true))
    .addBlankField()
    .addField("Status" , "Bitte wählen sie eine Aktion ... ");
    return {embed};
}

function createLogikMenu(collection){
    
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