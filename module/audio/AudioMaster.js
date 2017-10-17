const mode = "dev"; // dev oder activ

const config = require('./audio_config.json');
const Map = require("collections/map");

const AudioPlayer = require('./player/AudioPlayer.js');
const Song = require('./data/Song.js');
const YtLoader = require('./source/YtLoader');

const  { load } = require('../playlist/fileManager');

const {
    hasPermission,
    setOnBlacklist
} = require('./permission/Permission.js');

class AudioMaster {
    constructor(client) {
        this.client = client;

        this.prefix = config.prefix;
        this.channel = client.guilds.get(config[mode].guild).channels.get(config[mode].channel);

        this.player = new AudioPlayer();
        this.player.onNextSong = (song) => {
            this.client.user.setGame(song.title, song.url);
        };

        this.queue = [];
        this.skippers = [];
        this.skippsViaMute = {};

        this.musicRequest = {};
        this.botController = null;

        this.voiceChannel = null;
        // test
        this.reciver = null;

        this._initMap();
    }

    onMessage({message}) {
        if (message.content.indexOf(config.prefix) === 0) {
            const content = message.content.slice(config.prefix.length).trim();
            const args = content.split(/ +/g);

            if (message.channel.id === this.channel.id) {
                const cmd = args.shift().toLowerCase();
                const user = message.author;

                // ruft Funktion zum jeweiligen Befehl auf
                if (this.fnc.has(cmd)) {
                    if (hasPermission(cmd, message, this)) {
                        this.fnc.get(cmd)(message, args);
                    } else {
                        message.reply(` Du hast keine Berechtigung den Bot zu steuern!`);
                    }
                    message.delete();
                }
            }
        }
    }

    onVoiceStateChange({ oldMember, newMember }) {
        if (!oldMember.voiceChannel) return; // uns interessieren nur changes die aus dem Channel kommen

        if (!oldMember.user.bot && this.player.isActiv() && oldMember.voiceChannel.id === this.voiceChannel.id) {
            // Prüfen ob nur noch Bot im Channel ist
            if (this.voiceChannel.members.size === 1) {
                this.player.end();
                return;
            }

            this._skipWithMute(oldMember, newMember);
            this._checkDeaf(oldMember, newMember);

            if (this.botController.id === oldMember.user.id && newMember && newMember.voiceChannelID !== this.voiceChannel.id) {
                this.botController = this._chooseBotController();
            }
        }

        if (newMember && newMember.user.bot && newMember.voiceChannel && this.voiceChannel.id !== newMember.voiceChannelID) {
            this.voiceChannel = newMember.voiceChannel;
            this.player.end();
            this.channel.send("DjBotto wurde verschoben! Der Bot unterbricht seine Arbeit und verlässt den Channel in 10 Sekunden.");
        }
    }

    play(message, args) {
        var songID = null;
        YtLoader.getYoutubeSong(args.join(" "), (songID, details, err) => {
            if (err) {
                console.log(err);
                return;
            }

            // init Song Objekt
            const song = new Song(songID, details.title, message.author.username, "youtube", details.url);
            song.setDuration(details.duration);

            if (this.voiceChannel !== null) {
                this.player.addSong(song);
                message.reply(`Das Lied ${song.info()} wurde hinzugefügt!`);
            } else {
                const result = this._musicRequest(message.author.id, message.member.voiceChannel, song);

                if (result.err) {
                    message.reply("Dein Musik-Wunsch wird schon berücksichtigt");
                    return;
                }

                if (result.queue) {
                    this._startMusic(result.queue, message.member.voiceChannel);
                    if (result.queue.length === 1) this.channel.send(`Das Lied ${song.title} wurde hinzugefügt`);
                    this.channel.send(`Musik wurde im Channel **${this.voiceChannel.name}** gestartet!`);
                } else {
                    message.reply(`Dein Musik-Wunsch wurde empfangen! Das Lied ${song.info()} wird vermerkt!`);
                }
            }
        });
    }

    join(message, args) {
        const vcID = message.member.voiceChannel.id;
        if (this.musicRequest[vcID]) {
            const result = this._musicRequest(message.author.id, message.member.voiceChannel, null);

            if (result.err) {
                message.reply("Dein Musik-Wunsch wird schon berücksichtigt");
                return;
            }

            if (result.queue) {
                this._startMusic(result.queue, message.member.voiceChannel);
                this.channel.send(`Musik wurde im Channel ${this.voiceChannel.name} gestartet`);
            } else {
                message.reply("Dein Musik-Wunsch wurde empfangen!");
            }
        }
    }

    /*
        Neu machen!
    */
    help(message, args) {
        const indend = "```";
        var embed = {
            color: 0x00ff00,
            title: "Musik-Bot Befehle",
            fields: []
        };

        const prefix = ["+"];
        const {
            cmd_prefix
        } = config;

        var headers = 0;
        for (let key in cmd_prefix) {
            if (cmd_prefix[key].helper) {
                if (!cmd_prefix[key].only_controller && headers === 0) {
                    embed.fields.push({
                        name: `---------------------------------------------------------------`,
                        value: `Allgemeine Befehle`,
                        inline: false
                    });
                    headers++;
                }

                if (cmd_prefix[key].only_controller && headers === 1) {
                    embed.fields.push({
                        name: `---------------------------------------------------------------`,
                        value: `Bot-Controller Befehle`,
                        inline: false
                    });
                    headers++;
                }

                embed.fields.push({
                    name: `${cmd_prefix[key].info}`,
                    value: `${indend}${prefix.join("/")} ${cmd_prefix[key].prefix.join("/")} ${cmd_prefix[key].arguments}${indend}`,
                    inline: false
                });
            }
        }

        message.author.send({
            embed
        });
    }

    list(message) {
        const embed = this.player.list();

        if (embed !== null) {
            message.reply({
                embed
            });
        } else {
            message.reply(" Kein Titel in der Playlist");
        }
    }

    skip(message) {
        if (this.voiceChannel !== null) {
            this._skip(message.author.id, (skipMessage) => {
                if (skipMessage.info) {
                    message.reply(skipMessage.info);
                } else if (skipMessage.title) {
                    this.channel.send(`Das Lied ${skipMessage.title} wurde übersprungen`);
                }
            });
        }
    }

    save(message, args) {
        if (args[0]) {
            this.player.savePlaylist(args[0], (msg) => {
                // send Message
            });
        }
    }

    load(message, args) {
        if (args[0]) {
            const playlist = load(message.author.id, args[0]);
           
            if (playlist === null) {
                message.reply("Playlist konnte nicht geladen werden!");
                return;
            }

            playlist.forEach((songData) => {
                const song = Song.copy(songData);

                if (this.voiceChannel !== null) {
                    this.player.addSong(song);
                } else {
                    const result = this._musicRequest(message.author.id, message.member.voiceChannel, song);
                    if (result.queue) {
                        this._startMusic(result.queue, message.member.voiceChannel);
                        this.channel.send(`Musik wurde im Channel ${this.voiceChannel.name} gestartet`);
                    }
                }
            });     
        }
    }

    loop(message, args) {
        const setLoop = args[0] ? args[0].toLowerCase() === "on" : !this.player.isLooping;
        this.player.loop(setLoop);

        if (setLoop) {
            this.channel.send("DjBotto lässt die Playlist in einer Schleife laufen");
        } else {
            this.channel.send("DjBotto läuft nicht mehr im Loop-Modus");
        }
    }

    shuffle(message, args) {
        const setLoop = args[0] ? args[0].toLowerCase() === "on" : !this.player.isShuffling;
        this.player.shuffle(setLoop);

        if (setLoop) {
            this.channel.send("DjBotto wählt nun zufällig Lieder aus der Playlist");
        } else {
            this.channel.send("DjBotto wählt ab jetzt immer das nächste Lied in der Playlist");
        }
    }

    removeSong(message, args) {
        if (args[0]) {
            const pos = args.shift().trim();
            const song = this.player.removeSong(pos);

            this.channel.send(`Bot-Controller ${this.botController.username} hat das Lied ** ${song.title} ** entfernt!`);
        }
    }

    deleteList() {
        if (this.player.isActiv()) {
            this.player.end();
            this.channel.send(`Bot-Controller ${this.botController.username} hat die Playlist gelöscht!`);
        }
    }

    ban(message, args) {
        if (args[0] && args[1]) {
            const toBanUser = message.member.voiceChannel.members.find(val => val.user.username.toLowerCase(), args[0].toLowerCase());
            var time = args[1].trim();

            if (time < 60) {
                this.channel.send(`<@${toBanUser.id}> Du wurdest von ${this.botController.username} für ${time} Minuten gebannt!`);
                time *= 60 * 1000;
                setOnBlacklist(toBanUser.id, time, args.slice(2).join(" "));
            }
        }
    }

    _skipWithMute(oldMember, newMember) {
        // Mute zeitpunkt für Benutzer merken
        if (newMember && !oldMember.selfMute && newMember.selfMute) {
            this.skippsViaMute[newMember.id] = new Date().getTime();
        }

        if (newMember && oldMember.selfMute && !newMember.selfMute) {
            if (new Date().getTime() - this.skippsViaMute[newMember.id] < 1000) {
                this._skip(newMember.id, (skipMessage) => {
                    if (skipMessage.info) {
                        this.channel.send(`<@${oldmember.id}> ` + skipMessage.info);
                    } else if (skipMessage.title) {
                        this.channel.send(`Das Lied ${skipMessage.title} wurde übersprungen`);
                    }
                });
            }
        }
    }

    _checkDeaf(oldMember, newMember) {
        if (newMember && newMember.selfDeaf) {
            var nonSelfDeaf = this.voiceChannel.members.find(val => !val.selfDeaf && val.user.id !== newMember.user.id && !val.user.bot);
            if (nonSelfDeaf === null) {
                this.player.end();
            }
        }
    }

    _skip(userID, callback) {
        const threshold = Math.ceil((this.voiceChannel.members.size - 1) / 2);
        if (!this.skippers.includes(userID)) {
            this.skippers.push(userID);
        } else {
            callback({
                info: `Du hast schon für einen Skip gevotet! Benötigt: ${threshold - this.skippers.length} Skip-Wünsche zum überspringen!`
            });
        }


        if (this.skippers.length >= threshold) {
            this.skippers = [];
            this.player.skip(callback);
        } else {
            callback({
                info: `Dein Skip wird berücksichtig! Benötigt: ${threshold - this.skippers.length} Skip-Wünsche zum überspringen!`
            });
        }
    }

    _startMusic(queue, voiceChannel) {
        if (!this.player.isActiv() && this.voiceChannel === null) {
            this.voiceChannel = voiceChannel;
            this.botController = this._chooseBotController();

            this.player.setQueue(queue);

            this.voiceChannel.join().then((connection) => {

                connection.on('disconnect', () => {
                    this.voiceChannel = null;
                    this.botController = null;
                    this.client.user.setGame("");
                    this.player.reset();
                });

                this.player.onEnd = () => {
                    setTimeout(() => {
                        if (!this.player.isActiv() && this.voiceChannel !== null) {
                            this.voiceChannel.leave();
                        }
                    }, config.time_of_leave * 1000);
                }

                this.player.play(connection);
            });
        }
    }

    _musicRequest(userID, voiceChannel, song) {
        const vcID = voiceChannel.id;
        const threshold = Math.ceil((voiceChannel.members.size - 1) / 2);
        const timeNow = new Date().getTime();

        if (!this.musicRequest[vcID] || (timeNow - this.musicRequest[vcID].firstRequest) > (config.time_of_request * 1000)) {
            this.musicRequest[vcID] = {};
            this.musicRequest[vcID].requester = [];
            this.musicRequest[vcID].songQueue = [];
            this.musicRequest[vcID].firstRequest = new Date().getTime();
        }

        // hinzufügen des Songs
        if (song !== null) this.musicRequest[vcID].songQueue.push(song);

        // User hat schon gevotet ?
        if (!this.musicRequest[vcID].requester.includes(userID)) {
            this.musicRequest[vcID].requester.push(userID);
        } else {
            const err = "Benutzer hat schon gevotet!";
            return {
                err
            };
        }

        if (this.musicRequest[vcID].requester.length >= threshold) {
            const queue = this.musicRequest[vcID].songQueue.slice(0);
            delete this.musicRequest[vcID];
            return {
                queue
            };
        }

        return {};
    }

    _chooseBotController() {
        var controller = this.voiceChannel.members.find((val) => {
            return val.roles.find("name", config.controller_roles);
        });

        if (!controller) {
            controller = this.voiceChannel.members.first().user;
        } else {
            controller = controller.user;
        }
        this.channel.send(`<@${controller.id}> Du wurdest zum BotController ernannt!`);
        return controller;
    }

    _initMap() {
        const {
            cmd_prefix
        } = config;
        this.fnc = new Map();
        for (let key in cmd_prefix) {
            cmd_prefix[key].prefix.forEach((prefix) => {
                this.fnc.set(prefix, this[cmd_prefix[key].fnc].bind(this));
            });
        }
    }

    // to conenct with the Bot
    connect(subscribe) {
        subscribe('message', this.onMessage.bind(this));
        subscribe('voiceStateUpdate', this.onVoiceStateChange.bind(this));
    }

}

module.exports = AudioMaster;