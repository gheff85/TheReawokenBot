const Discord = require('discord.js');
const client = new Discord.Client();

client.on('message', message => {
  if (message.content.toLowerCase() === '!rb startSchedule') {
    var channel = message.channel;
    channel.send("Schedule Started");
    setInterval(function(){
        channel.send("Test scheduled message");
    }, 30000);
  }
});

client.login(process.env.BOT_TOKEN);
