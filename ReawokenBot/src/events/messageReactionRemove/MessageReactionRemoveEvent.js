const BaseEvent = require('../../utils/structures/BaseEvent');
const common = require("../../utils/common/commonFunctions");

module.exports = class MessageReactionRemoveEvent extends BaseEvent {
  constructor() {
    super('messageReactionRemove');
  }
  async run (client, messageReaction, member) {
    if (member.bot) return;

    await common.logLastUsersMessageTimestamp(member.id, new Date())
  }
}