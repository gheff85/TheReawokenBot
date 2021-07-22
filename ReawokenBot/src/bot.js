const { Client } = require('discord.js');
const Discord = require("discord.js");
const { registerCommands, registerEvents } = require('./utils/registry');
require('dotenv').config({path: __dirname + '/.env'})
const client = new Client({ ws: { intents: new Discord.Intents(Discord.Intents.ALL) }});


process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

(async () => {
  client.commands = new Map();
  client.events = new Map();
  client.prefix = "!rb ";
  await registerCommands(client, '../commands');
  await registerEvents(client, '../events');
  await client.login(process.env.BOT_TOKEN);
})();

