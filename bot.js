const Discord = require('discord.js');
const client = new Discord.Client();

client.on('ready', () => {
    var inactiveUsers = client.channels.get(process.env.UNREGMEMBERS).catch(e => {
     console.error(e)
    });
    inactiveUsers.send("Searching for inactive users");
    setInterval(function(){
       message.channel.send('Test message').catch(e => {
       console.error(e)
     });
   }, 30000);

  });


client.on('message', message => {
  if (message.content.toLowerCase() === '!rb test') {
    message.channel.send('Schedule Started');
    
    //setInterval(function(){
      //  message.channel.send('Test message');
   // }, 30000);

  }
});



client.login(process.env.BOT_TOKEN);
