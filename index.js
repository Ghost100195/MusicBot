const Discord = require("discord.js");
const client = new Discord.Client();

const AudioPlayer = require("./audio/AudioMaster.js");
const Bot = require('./bot/bot.js');

const config = require("./config.json");

var prefixs = [];
var fnc = {};

client.on("ready", () => {
  player = new AudioPlayer(client);
  bot = new Bot();

  fnc[player.prefix] = player;
  fnc[bot.prefix] = bot;
  prefixs.push(bot.prefix);
  prefixs.push(player.prefix);
  console.log("ready");
});


client.on("message", message => {
  if(message.author.bot) return;
  
  for(let i = 0; i < prefixs.length; i++){
    if(message.content.indexOf(prefixs[i]) === 0){
      message.content = message.content.slice(prefixs[i].length).trim();
      const args = message.content.split(/ +/g);
      fnc[prefixs[i]].onMessage(message, args);

      message.delete();
      break;
    }
  }
});

client.on("voiceStateUpdate", (oldMember, newMember) => {
  player.onVoiceStateChange(oldMember, newMember);
});

// login
client.login(config.dev_token);
