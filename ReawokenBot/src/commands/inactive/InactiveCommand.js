const BaseCommand = require('../../utils/structures/BaseCommand');
const moment = require("moment");
require('dotenv').config({ path: __dirname + '/.env' })
const common = require("../../utils/common/commonFunctions");

module.exports = class InactiveCommand extends BaseCommand {
    constructor() {
        super('inactive', 'admin', []);
    }

    async run(client, msg, args) {
        if (msg.channel.id === process.env.REAWOKEN_COMMANDS_CHANNEL) {

            const Role = msg.guild.roles.cache
                .find(r => r.name === "Registered")

            const registeredMembers = Role.members
                .filter(u => u.user.bot === false)
                .map(m => {
                    return {
                        user_id: m.user.id,
                        user_tag: m.user.tag.split(" ")[0],
                        DisplayName: m.displayName,
                        JoinedDate: m.joinedAt
                    }
                });

            const membersLastActivity = await common.getAllUsersLastMessageTimestamp()
                .catch((e) => Promise.reject({message: "getAllUsersLastMessageTimestamp: " + e.message}));

            const inactiveUsers = registeredMembers.map(m => {
                let userActivity = membersLastActivity.filter(a => a.user_id === m.user_id)[0]
                return {
                    DisplayName: m.DisplayName,
                    UserId: m.user_id,
                    JoinedDate: m.JoinedDate,
                    Date: typeof userActivity === "undefined" ? new Date(2020, 1) : userActivity.date
                }
            })
                .filter(m => { return filterBeforeDate(m.Date, 21)})
                .filter(m => {return filterBeforeDate(m.JoinedDate, 7)});

            const holChannel = msg.client.channels.cache.get(process.env.MEMBERS_HOLIDAY_CHANNEL)

            const holidayMsgs = await getAllChannelMessages([holChannel])
                .catch((e) => Promise.reject({ message: "getAllChannelMessages (Holiday): " + e.message }));

            const MembersOnHoliday = getUserIdsFromHolidayMessages(msg, holidayMsgs)

            const inactiveUsersNotOnHolidays = inactiveUsers.filter(u => !MembersOnHoliday.includes(u.UserId));

            if (inactiveUsersNotOnHolidays.length > 0) {
                const inactiveUsersText = inactiveUsersNotOnHolidays.map(m => {
                    return `${m.DisplayName} lastActive: ${m.Date.getTime() === new Date(2020, 1).getTime() ? "No Activity Found" : m.Date}`;
                })

                //     inactiveUsersNotOnHolidays.forEach(m=>{
                //         (msg.guild.members.cache.find(u=>u.id === m.UserId)).kick("Inactive");
                //     })

                if (inactiveUsersText.length > 30) {
                    let numberOfLoops = Math.ceil(inactiveUsersText.length / 30)
                    let messageText = inactiveUsersText.slice(0, 30);

                    await msg.reply("The following members have been marked as inactive to be removed from the clan:\n`" + messageText.join('\n') + "`")
                        .catch((e) => Promise.reject({ message: e.message }));

                    for (let i = 1; i < numberOfLoops; i++) {
                        if (i === (numberOfLoops - 1)) {
                            messageText = inactiveUsersText.slice(i * 30)
                        }
                        else {
                            messageText = inactiveUsersText.slice(i * 30, (i + 1) * 30)
                        }

                        await msg.reply("\n`" + messageText.join('\n') + "`")
                            .catch((e) => Promise.reject({ message: e.message }));
                    }
                }
                else {
                    await msg.reply("The following members have been marked as inactive to be removed from the clan:\n`" + inactiveUsersText.join('\n') + "`")
                        .catch((e) => Promise.reject({ message: e.message }));
                }
            }
            else {
                return Promise.reject({ message: "No Inactive Members Found" });
            }
        }
    }
}

async function getAllChannelMessages(channelList) {
    const messageList = [];
    let last_id;

    for (var channel of channelList) {
        while (true) {
            const options = { limit: 100 };
            if (last_id) {
                options.before = last_id;
            }

            const messages = await channel.messages.fetch(options)
                .catch((e) => Promise.reject({ message: e.message }));

            if (messages.size > 0) {
                messageList.push(...messages.array());
                last_id = messages.last().id;
            }
            if (messages.size != 100) {
                break;
            }
        }
        last_id = undefined;
    }

    return messageList;
}

function getFirstMessageDate(msgs) {
    return msgs.length > 0 ?
        new Date(msgs.sort(function (a, b) {
            return new Date(b.createdTimestamp) - new Date(a.createdTimestamp);
        })[0].createdTimestamp) :
        new Date(2020, 1)
}

function filterBeforeDate(prop, days) {
    let date = new Date();
    date.setDate(date.getDate() - days);
    return prop.getTime() < date.getTime()
}

function getUserIdsFromHolidayMessages(msg, holidayMsgs) {
    return holidayMsgs.map(h => {
        if (h.content.substring(0, 4) === 'User') {
            var isIndex = h.content.indexOf(' is ');
            var user = h.content.substring(6, isIndex);
            var startIndex = h.content.indexOf('Start Date');
            var startDate = moment(h.content.substring(startIndex + 12, startIndex + 22), 'MM/DD/YYYY');
            startIndex = h.content.indexOf('End Date');
            var endDate = moment(h.content.substring(startIndex + 10, startIndex + 20), 'MM/DD/YYYY');

            if (startDate.isBefore(moment()) && endDate.isAfter(moment())) {
                return msg.client.users.cache.find(u => u.tag === user).id;
            }
            else {
                return "";
            }
        }
        return "";
    }).filter(m => m !== "");
}
