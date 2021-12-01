const BaseCommand = require('../../utils/structures/BaseCommand');
const {storeError}  = require('../../utils/common/commonFunctions');
const {MessageEmbed} = require("discord.js");
require('dotenv').config({
    path: __dirname + '/.env'
})

module.exports = class RegisterCommand extends BaseCommand {
    constructor() {
        super('register', 'user', []);
    }

    async run(client, msg) {
        // try {
        //     const platformEmbed = new MessageEmbed().setColor(0x4286f4).setTitle(`**Locale Assignment**`)
        //     .setDescription("React/click the flag which repersents your closest locale.")

        //     msg.channel.send(platformEmbed).then(async embedMessage => {
        //         await embedMessage.react(":uk:915631788431392779")
        //         await embedMessage.react(":eu:915631788683034694")
        //         await embedMessage.react(":us:915631788322345042")
        //         await embedMessage.react(":au:915631788758544434")
        //     })
        // } catch (e) {
        //     console.log(e)
        //     storeError(e).then(res => console.log(res)).catch(e => console.log(e));
        // }
    }
}
