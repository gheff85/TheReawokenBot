const BaseEvent = require('../../utils/structures/BaseEvent');
const {MongoClient} = require('mongodb');
const commonFunctions = require('../../utils/common/commonFunctions')

module.exports = class GuildMemberRemoveEvent extends BaseEvent {
    constructor() {
        super('guildMemberRemove');
    }
    async run(client, member) {
        member.roles.set([]).catch(e => {
            commonFunctions.storeError(e).then(res => console.log(res)).catch(e => console.log(e));
        })
        const dbClient = new MongoClient(process.env.MONGODB_URI, {useUnifiedTopology: true});
        await dbClient.connect().catch(e => {
            console.log(e.message);
            return "Cannot connect to db";
        });

        await dbClient.db('clan_info').collection('levels').deleteOne({"user_id": member.id}).catch(e => {
            console.log(e.message);
            return "User stats not deleted";
        });

        await dbClient.db('clan_info').collection('discord_activity').deleteOne({"user_id": member.id}).catch(e => {
            console.log(e.message);
            return "User stats not deleted";
        });

        await dbClient.close().catch(e => {
            console.log(e.message)
        });
    }
}
