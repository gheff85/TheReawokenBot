const BaseCommand = require('../../utils/structures/BaseCommand');
const common = require("../../utils/common/commonFunctions");

module.exports = class RankcardCommand extends BaseCommand {
    constructor() {
        super('rankcard', 'user', []);
    }

    async run(client, msg) {
        if (msg.channel.id === process.env.STAT_CHECKER_CHANNEL) {
            let userStats = await common.getUserStats(msg.author.id).catch(e => {
              console.log(e.message);
              console.log(common.storeError(e));
            });
        
            if(userStats && (userStats.level > 0)) {
              await common.generateRankCard(msg.channel, userStats, null)
              .catch((e) => Promise.reject({message: e.message}));
            } else {
              await msg.channel.send("<@" + msg.author.id + "> You have not had enough Discord participation to be able to generate a rankcard")
              .catch((e) => {
                console.log(e.message)
                console.log(common.storeError(e));
              });
            }
        }
    }
}