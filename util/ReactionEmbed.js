const discord = require('Discord.js');
const { drawList, drawLine } = require('./OutputFormer');

class ReactionEmbed extends discord.RichEmbed{

    constructor(){
        super();
        this.symbols = [];
    }
    //  TEXT COLORING; PROLOG = RED , FIX = ORANGE, CSS = GREEN


    addList(header, items, width){
        this._extractSymbols(items)

        const list =  drawLine(width) + "\n" + drawList(items, width);
        this.addField(header, list);
        return this;
    }

    addStatus(state){
        this.addField("Status", "```fix\n" + state +  "\n```");
        return this;
    }

    getReactionListener(callback){
        if(this.symbols.length === 0) return;

        return (msg) => {
            this.symbols.forEach((emoji) => msg.react(emoji).catch((err) => console.log("Unknown Emoji: " + emoji)));
                
            const collector = msg.createReactionCollector((reaction, user) => {
                if(!user.bot){
                    if(this.symbols.includes(reaction.emoji.name)){
                        callback(reaction.emoji.name, user);
                    }
                    msg.delete();
                    collector.stop()
                }
            });
        };
    }

    _extractSymbols(items){
        items.forEach(({symbole}) => {
            this.symbols.push(symbole);
            console.log(symbole);
        });
    }
}

module.exports = ReactionEmbed;