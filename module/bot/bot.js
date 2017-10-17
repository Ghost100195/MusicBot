const config = require('./config.json');
const fs = require('fs');


class Bot{

    constructor(){
        this.prefix = config.prefix;
    }

    onMessage({ message }){
        if(message.content.indexOf(config.prefix) === 0){
            console.log(message.content);
            message.content = message.content.slice(config.prefix.length).trim();
            const args = message.content.split(/ +/g);
            
            const cmd = args.shift().trim();
            if(this[cmd]){
                this[cmd](message, args);
                message.delete();
            }
        }
    }

    bug(message, args){
        if(args[0]){
            let bug = require("./bugReport.json");
            bug[new Date().getTime()] = args.join(" ");
        
            fs.writeFile("./bot/bugReport.json", JSON.stringify(bug ,null, 2), (err) => {
              if(err) console.log(err);
              message.reply("Dein Bug-Report war erfolgreich!");
            });
          }
    }

    wish(message, args){
        if(args[0]){
            let wish = require("./wishRequest.json");
            wish[new Date().getTime()] = args.join(" ");
        
            fs.writeFile("./bot/wishRequest.json", JSON.stringify(wish ,null, 2), (err) => {
              if(err) console.log(err);
              message.reply("Dein 'Wunsch' wurde empfangen und gespeichert!");
            });
          }
    }

    lan(message, args){
        const ngc = new Date("2017-10-05T17:00:00.000Z");
        const today = new Date();
        var time = (ngc.getTime() - today.getTime())/ 1000; 
      
        // ms in sek  = / 1000
        // sek in min = / 60
        // min in std = / 60
        // std in days = / 24
      
        var min = Math.floor(time / 60);
        var std = Math.floor(min / 60);
        const days = Math.floor(std / 24);
      
        time = time - (min * 60);
        min = min - ( std * 60);
        std = std - ( days * 24);
        
        if(min / 10 < 1) min = "0"+min;
        if(std / 10 < 1) std = "0"+std;
        if(time / 10 < 1) time = "0"+time;
      
      
        message.reply(`** NGC 2017 Countdown - ${days} : ${std} : ${min} : ${time.toFixed(0)} **`);
    }    

    /*
        Neu machen!
    */
    help(message, args){
        const indend = "```";
        var embed ={
          color: 0x00ff00,
          title: "Bot Befehle",
          fields:[]
        };
  
        const prefix = ["!"];
        const { cmd_prefix } = config;

   
        for( let key in cmd_prefix){
            if(cmd_prefix[key].helper){
                embed.fields.push({
                    name : `${cmd_prefix[key].info}`,
                    value : `${indend}${prefix.join("/")} ${cmd_prefix[key].prefix.join("/")} ${cmd_prefix[key].arguments}${indend}`,
                    inline :  false
                });
            }
        }
  
        message.author.send({embed});
    }

    patchNotes(){
        var text = "**Patch Notes v0.2 Alpha ** \n"+
                    "Es wurden Funktionen hinzugefügt und Bugs entfernt. \n\n";
      
      
        const patchNotes = require("./patches/changes.json");
        
        text += "**Bugfixes ** \n\n";
      
        for(let key in patchNotes["Bugfix"]){
            text +="   **" +  key + "** : " + patchNotes["Bugfix"][key] +"\n";    
        }
      
        text += "\n**Neu ** \n\n";
          
        for(let key in patchNotes["Neu"]){
          text += "   **" + key + "** : " + patchNotes["Neu"][key] +"\n";    
        }
      
        text += "\n**Design/Formatierung ** \n\n";
            
        for(let key in patchNotes["Änderungen"]){
            text +="   **" + key + "** : " + patchNotes["Änderungen"][key] +"\n";    
        }
      
        text += "\n Der Bot ist für jeden Verfügbar! \n Die Befehle für den Bot erhaltet ihr mittels Eingabe von ```+ help``` in den Channel **musiklinks**";
      
      
        return text;
      };

      connect(subscribe){
            subscribe("message", this.onMessage.bind(this));
      }
}

module.exports = Bot;