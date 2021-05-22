const BaseEvent = require('../../utils/structures/BaseEvent');
require('dotenv').config({path: __dirname + '/.env'})

module.exports = class ReadyEvent extends BaseEvent {
  constructor() {
    super('ready');
  }
  async run (client) {
    console.log(client.user.tag + ' has logged in.');
    setInterval(() => {updateMemberCount(client)}, 15*60*1000);
  }
}

const updateMemberCount = async (client) => {
  const guild = await client.guilds.cache.get(process.env.GUILD_ID)

  const memberCount = guild.members.cache.filter(member => !member.user.bot).size;

  let memberCountChannel = guild.channels.cache.get(process.env.MEMBER_COUNT_CHANNEL)

  await memberCountChannel.setName('Member Count: ' + memberCount)
}