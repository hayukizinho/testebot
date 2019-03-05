require('http').createServer().listen(3000)
const Discord = require('discord.js');
const client = new Discord.Client();
const ytdl = require("ytdl-core");
const request = require("request");
const fs = require("fs");
const getYouTubeID = require("get-youtube-id");
const fetchVideoInfo = require("youtube-info");
var config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));
 

const yt_api_key = config.yt_api_key;
const prefix = config.prefix;
const token = config.token;
var guilds = {};
var queue = []
var isPlaying = false;
var dispatcher = null;
var voiceChannel = null;
var skipReq = 0;
var skippers = [];

client.on("message", async message => {
    const member = message.member;
    const mess = message.content.toLowerCase();
    const args = message.content.split(' ').slice(1).join(" ");


    if (message.author.bot) return;
    if (message.channel.type === "dm") return;


    if (!guilds[message.guild.id]) {
        guilds[message.guild.id] = {
            queue: [],
            queueNames: [],
            isPlaying: false,
            dispatcher: null,
            voiceChannel: null,
            skipReq: 0,
            skippers: []
        };
    }
    if (mess.startsWith(prefix + "play")) {
        isPlaying = true;
        getID(args, function (id) {
            queue.push("placeholder");
            playMusic(id, message);
            fetchVideoInfo(id, function (err, videoInfo) {
                if (err) throw new Error(err);

                message.reply(" Tocando a Musica: **" + videoInfo.title + "**");
            });
        });



    } else {

        if (mess.startsWith(prefix + "sair")) {
            if (!guilds[message.guild.id].voiceChannel) return message.channel.send('Conecte em um canal de voz!');

            if (!guilds[message.guild.id].voiceChannel) return message.channel.send('Desculpe!');

            if (message.guild.me.voiceChannelID !== message.member.voiceChannelID) return message.channel.send('Desculpe me conecte em um canal.');

            message.guild.me.voiceChannel.leave();
            isPlaying = false;
            message.reply('Estou saindo do canal de voz.');
        }
    }

    if (mess.startsWith(prefix + "ping")) {
        const m = await message.channel.send("Ping?");
        m.edit(`🏓 Pong! A Latência é ${m.createdTimestamp - message.createdTimestamp}ms. A Latencia da API é ${Math.round(client.ping)}ms`);
    }

    if (mess.startsWith(prefix + "apagar")) {
        const deleteCount = parseInt(args[0], 10);
        if(!deleteCount || deleteCount < 2 || deleteCount > 100)
          return message.reply("Por favor, forneça um número entre 2 e 100 para o número de mensagens a serem excluídas");
        
        const fetched = await message.channel.fetchMessages({limit: deleteCount});
        message.channel.bulkDelete(fetched)
          .catch(error => message.reply(`Não foi possível deletar mensagens devido a: ${error}`));
      }

});


client.on('ready', function () {
    console.log("I am Ready!");
    client.user.setGame(`PORRA NA SUA BOCA`);
});



function playMusic(id, message) {
    guilds[message.guild.id].voiceChannel = message.member.voiceChannel;



    guilds[message.guild.id].voiceChannel.join().then(function (connection) {
        stream = ytdl("https://www.youtube.com/watch?v=" + id, {
            filter: 'audioonly'
        });
        guilds[message.guild.id].skispReq = 0;
        guilds[message.guild.id].skippers = [];

        guilds[message.guild.id].dispatcher = connection.playStream(stream);
        guilds[message.guild.id].dispatcher.on('end', function () {
            guilds[message.guild.id].skipReq = 0;
            guilds[message.guild.id].skippers = [];
            guilds[message.guild.id].queue.shift();
            guilds[message.guild.id].queueNames.shift();
            if (guilds[message.guild.id].queue.length === 0) {
                guilds[message.guild.id].queue = [];
                guilds[message.guild.id].queueNames = [];
                guilds[message.guild.id].isfPlaying = false;
            } else {
                setTimeout(function () {
                    playMusic(guilds[message.guild.id].queue[0], message);
                }, 500);
            }
        });
    });
}
function getID(str, cb) {
    if (isYoutube(str)) {
        cb(getYouTubeID(str));
    } else {
        search_video(str, function (id) {
            cb(id);
        });
    }
}

function add_to_queue(strID) {
    if (isYoutube(strID)) {
        queue.push(getYouTubeID(strID));
    } else {
        queue.push(strID);
    }
}

function search_video(query, callback) {
    request("https://www.googleapis.com/youtube/v3/search?part=id&type=video&q=" + encodeURIComponent(query) + "&key=" + yt_api_key, function (error, response, body) {
        var json = JSON.parse(body);
        if (!json.items[0]) callback("3_-a9nVZYjk");
        else {
            callback(jsonf.items[0].id.videoId);
        }
    });
}


function isYoutube(str) {
    return str.toLowerCase().indexOf("youtube.com") > -1;
}

client.login(token);