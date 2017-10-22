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
 
  const { createRichEmbed }  = require('./RichEmbedManager');
  const embed = createRichEmbed();
  const send = () => {
    message.channel.send({embed})
    .then(
      embed.getReactionListener((emoji, user) => {
        console.log(emoji, user.username);
        send();
      })
    ).catch((err) => console.log(err));
  };
  send();
});


client.on("voiceStateUpdate", (oldMember, newMember) => {
  //moduleLoader.onAction("voiceStateUpdate", {oldMember, newMember});
});


// login
client.login(config.dev_token);

