const Discord = require('discord.js');
const client = new Discord.Client();

client.on('message', message => {
  if (message.content.toLowerCase() === '!rb test') {
    message.channel.send('Schedule Started');
    
    setInterval(function(){
        message.channel.send('Test message');
    }, 30000);

  }
});



client.login(process.env.BOT_TOKEN);
