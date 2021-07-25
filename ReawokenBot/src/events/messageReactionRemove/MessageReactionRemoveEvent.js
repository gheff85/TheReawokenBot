const BaseEvent = require('../../utils/structures/BaseEvent');
const {logLastUsersMessageTimestamp} = require("../../utils/common/commonFunctions");

module.exports = class MessageReactionRemoveEvent extends BaseEvent {
  constructor() {
    super('messageReactionRemove');
  }
  async run (client, messageReaction, member) {
    if (member.bot) return;

    await logLastUsersMessageTimestamp(member.id, new Date())
  }
}