const Discord = require('discord.js');
const client = new Discord.Client();

client.on('message', message => {
  if (message.content.toLowerCase() === '!rb test') {
    message.channel.send('Schedule Started');
  }
});

client.on('message', message => {
  if (message.content.toLowerCase() === '!rb startSchedule') {
    message.channel.send('Schedule Started');
    
  }
});


client.login(process.env.BOT_TOKEN);
