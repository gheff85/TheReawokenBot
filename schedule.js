const Discord = require('discord.js');
const client = new Discord.Client();

client.on('ready', () => {
    var inactiveUsers = client.channels.get(process.env.UNREGMEMBERS);
    inactiveUsers.send("Searching for inactive users");
    setInterval(function(){
       message.channel.send('Test message');
   }, 30000);

  }
});



client.login(process.env.BOT_TOKEN);
