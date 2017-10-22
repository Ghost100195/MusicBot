const Discord = require("discord.js");
const client = new Discord.Client();

const config = require("./_config.json");
const moduleLoader = require('./module/ModuleLoader.js');

client.on("ready", () => {
 // moduleLoader.loadModules(client);
  console.log("ready");
});

client.on("message", message => {
  // bot reagieren nicht auf bots
  if(message.author.bot) return;
  
 // moduleLoader.onAction("message", {message});
 
  
  const sendMessage = () => {
    message.reply(createPlaylistMenu())
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
  }

  sendMessage();
  message.reply(createBox());
});

client.on("voiceStateUpdate", (oldMember, newMember) => {
  //moduleLoader.onAction("voiceStateUpdate", {oldMember, newMember});
});



function createRichEmbeds(){
  const embed = new Discord.RichEmbed();
  const user = "▶ ** play **\n⏩ ** skip **\n" + 
                ":one: ** load **\n:two: ** join **\n:three: ** list **";

  const botController = ":repeat: ** Aktivieren/Deaktivieren Schleifenmodus **\n:twisted_rightwards_arrows: ** Aktivieren/Deaktivieren Shuffle **\n" + 
                ":eight: ** delall **\n:nine: ** del **\n:no_entry: ** ban **";
  embed
  .setAuthor("DjBotto")
  .setColor("GREEN")
  .setTitle("hat momentan nichts zu tun!")
  .setDescription("Rufe mithilfe der Befehle DjBotto in dein Channel damit er was zu tun hat!")
  .addField("User Befehle", user)
  .addField("BotController Befehle", botController);
  return {embed};
}


function createPlaylistMenu(){
  const embed = new Discord.RichEmbed();
  const user = "<:one:370854405563744257> ** Erstelle **\n2⃣ ** Lösche **\n" + 
                "3⃣ ** Ändere **\n4⃣ ** Umbennen **\n";

  embed
  .setAuthor("DjBotto")
  .setColor("GREEN")
  .setTitle("Playlist-Edit-Menu")
  .setDescription("Du befindest dich im Playlist-Edit Modus")
  .addField("Folgende Befehle sind für Playlisten möglich: ", user)

  return {embed};
}

function createPlaylist(){
  

  const embed = new Discord.RichEmbed();
  const user = "** 1. Dance **\n ** 2. Rock **\n";
  const inline = true;
  embed
  .setColor("GREEN")
  .setTitle("Playlist")
  .addField("Namen:", user, inline)
  .addField("dwa", "dwa",  inline)
  .addField("Namen:", user, inline)
  .addField("dwa", "he",  inline)
  .addBlankField(inline)
  .addField("dwa", "dwa",  inline);
  return {embed};
}

function createBox(){
  const {drawBox} =  require('./OutputFormer.js');
  const embed = new Discord.RichEmbed();
  embed
  .setColor("GREEN")
  .setTitle("Playlist")
  .setDescription("```"+ drawBox({content: "hello World", padding: 10}) + "```");
  return {embed};
}

// login
client.login(config.dev_token);

