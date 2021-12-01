const BaseEvent = require('../../utils/structures/BaseEvent');
const {logLastUsersMessageTimestamp, generateExperience} = require("../../utils/common/commonFunctions");
module.exports = class MessageEvent extends BaseEvent {
  constructor() {
    super('message');
  }
  
  async run(client, message) {
    if (message.author.bot) return;

    let messageContent;

    if(message.content
      .toLowerCase() === "!register"){
        messageContent = "register"
    }
    else {
      messageContent = message.content
      .toLowerCase()
      .slice(client.prefix.length)
      .trim();
    }

    await logLastUsersMessageTimestamp(message.author.id, new Date())

    if(messageContent !== "rankcard"){
      await generateExperience(message)
    }

    if (message.content.startsWith(client.prefix) || messageContent === "register") {
      const [cmdName, ...cmdArgs] = messageContent
                                    .split(/\s+/);

      const command = client.commands.get(cmdName);
      if (command) {
       await command.run(client, message, cmdArgs)
            .catch((e) => message.channel.send(e.message));
      }
    }
  }
}