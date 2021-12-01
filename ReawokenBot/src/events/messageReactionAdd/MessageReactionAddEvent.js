const BaseEvent = require('../../utils/structures/BaseEvent');
const {logLastUsersMessageTimestamp} = require("../../utils/common/commonFunctions");
require('dotenv').config({path: __dirname + '/.env'})

module.exports = class MessageReactionAddEvent extends BaseEvent {
  constructor() {
    super('messageReactionAdd');
  }
  async run (client, messageReaction, member) {
    if (member.bot) return;

    await logLastUsersMessageTimestamp(member.id, new Date())

    if(messageReaction.message.id == process.env.PLATFORM_MESSAGE || messageReaction.message.id == process.env.LOCALE_MESSAGE){
      const RegisteredRole = messageReaction.message.guild.roles.cache.find(r => r.name === "Registered")
      messageReaction.message.guild.members.cache.find(m => m.id === member.id).roles.add(RegisteredRole)

      const Role = messageReaction.message.guild.roles.cache.find(r => r.name === messageReaction.emoji.name)
      messageReaction.message.guild.members.cache.find(m => m.id === member.id).roles.add(Role);
    }
  }
}