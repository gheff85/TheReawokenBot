const BaseEvent = require('../../utils/structures/BaseEvent');
const common = require("../../utils/common/commonFunctions");

module.exports = class MessageReactionAddEvent extends BaseEvent {
  constructor() {
    super('messageReactionAdd');
  }
  async run (client, messageReaction, member) {
    if (member.bot) return;

    await common.logLastUsersMessageTimestamp(member.id, new Date())
  }
}