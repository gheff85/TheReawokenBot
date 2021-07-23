const BaseCommand = require('../../utils/structures/BaseCommand');
require('dotenv').config({path: __dirname + '/.env'})
// const common = require("../../utils/common/commonFunctions");
const axios = require('axios').default;

module.exports = class CompareCommand extends BaseCommand {
    constructor() {
        super('compare', 'admin', []);
    }

    async run(client, msg, args) {
        if (msg.channel.id === process.env.REAWOKEN_COMMANDS_CHANNEL) {

            const Role = msg.guild.roles.cache
                .find(r => r.name === "Registered")

            const registeredMemberIDs = Role.members
                .filter(u => u.user.bot === false)
                .map(m => {
                    return {
                        user_id: m.user.id,
                        user_tag: m.user.tag,
                        DisplayName: m.displayName,
                        JoinedDate: m.joinedAt
                    }
                });

            const AllMemberIDs = msg.guild.members.cache
                .filter(u => u.user.bot === false)
                .map(m => {
                    return {
                        user_id: m.user.id,
                        user_tag: m.user.tag,
                        DisplayName: m.displayName,
                        JoinedDate: m.joinedAt
                    }
                });

            const clanMembers = await getClanMembers()
                .catch((e) => Promise.reject({ message: "getClanMembers: " + e.message}));

            const notInClan = AllMemberIDs.filter(m =>
                !clanMembers.some(c =>
                    (m.DisplayName.toLowerCase().includes(c.lastSeenDisplayName.toLowerCase())) ||
                    (m.DisplayName.toLowerCase().includes(c.displayName.toLowerCase()))
                )
            );

            const notInDiscord = clanMembers.filter(c =>
                !AllMemberIDs.some(m =>
                    (m.DisplayName.toLowerCase().includes(c.lastSeenDisplayName.toLowerCase())) ||
                    (m.DisplayName.toLowerCase().includes(c.displayName.toLowerCase()))
                )
            );

            const notRegistered = AllMemberIDs.filter(m =>
                !registeredMemberIDs.some(r =>
                    r.DisplayName === m.DisplayName)
            );

            await msg.reply("The following members are in Discord but not the clan:\n`" +
                notInClan.map(c => c.DisplayName).join('\n') + "`")
                .catch((e) => Promise.reject({message: e.message}));

            await msg.reply("The following members are in the Clan but not in Discord:\n`" +
                notInDiscord.map(d => ("{" + d.displayName + ", " + d.lastSeenDisplayName + '}')).join('\n') + "`")
                .catch((e) => Promise.reject({ message: e.message }));

            await msg.reply("The following members are not registered in Discord:\n`" +
                notRegistered.map(r => r.DisplayName).join('\n') + "`")
                .catch((e) => Promise.reject({message: e.message}));
        }
    }
}

async function getClanMembers() {
    let config = {
        headers: {
            'X-API-Key': process.env.BUNGIE_API_KEY,
        }
    }

    return await axios.get(process.env.GET_MEMBERS_ENDPOINT, config)
        .then(r => {
            return memberResults = r.data.Response.results.map(m => {
                return {
                    lastSeenDisplayName: m.destinyUserInfo.LastSeenDisplayName,
                    displayName: m.destinyUserInfo.displayName
                }
            });
        })
        .catch((e) => Promise.reject({message: e.message}));
}