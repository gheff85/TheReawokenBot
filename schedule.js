const Discord = require('discord.js');
const client = new Discord.Client();

client.on('ready', () => {

var guild = client.guild.get(process.env.GUILD_ID);
var unRegChannel = guild.channels.get(process.env.UNREGMEMBERS);

setInterval(function(){

unRegChannel.sendMessage("Test Message");
}, 20000);
});

client.login(process.env.BOT_TOKEN);
