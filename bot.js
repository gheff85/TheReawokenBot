const Discord = require('discord.js');
const client = new Discord.Client();

client.on('message', message => {
  if (message.content.toLowerCase() === '!rb test') {
    message.reply('Test Successful');
  }
});

client.login(process.env.BOT_TOKEN);
