const Discord = require('discord.js');
const client = new Discord.Client();


client.on('message', message => {
  if (message.content.toLowerCase() === '!rb test') {
    message.channel.send('Finding inactive members...');
    
    var chat = message.guild.channels.get(process.env.UNREGMEMBERS);
    var messages = chat.fetch();
    var lastmess = messages.first();
    message.channel.send(lastmess.author);
    

  }
});



client.login(process.env.BOT_TOKEN);
