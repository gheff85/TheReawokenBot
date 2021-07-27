const BaseCommand = require('../../utils/structures/BaseCommand');
require('dotenv').config({
    path: __dirname + '/.env'
})
var moment = require("moment");
const {getHolidayMessageAndUserById, storeUserHoliday, getLastHolidayId, removeHoliday} = require('../../utils/common/commonFunctions');

module.exports = class AfkCommand extends BaseCommand {
    constructor() {
        super('afk', 'user', []);
    }

    async run(client, msg, args) {
        if (msg.channel.id === process.env.MEMBERS_HOLIDAY_CHANNEL) {
            
            switch(args[0].toLowerCase()) {
                case 'delete':
                    await performHolidayDelete(msg, args).catch(e => Promise.reject({message: e.message}));
                    break;
                case 'edit':
                    await performHolidayEdit(msg, args).catch(e => Promise.reject({message: e.message}));
                    break;
                case 'create':
                    await performHolidayCreate(client, msg, args).catch(e => Promise.reject({message: e.message}));
                    break;
                default:
                    return Promise.reject({message: "Argument not recognised. \nCheck #members-holidays-help for valid arguments"})
            }
        }
    }
}

async function performHolidayDelete(msg, args) {
    let holidayMessageAndUser;
    let holidayId = args[1];

    holidayMessageAndUser = await getMessageIdAndUser(holidayId).catch(e => Promise.reject({message: e.message}));

    const message = await msg.channel.messages.fetch(holidayMessageAndUser.messageId)
    await message.delete().catch((e) => Promise.reject({message: e.message}));
    await removeHoliday().catch(e => Promise.reject({message: e.message}));
}

async function performHolidayEdit(msg, args) {
    let holidayMessageAndUser;
    let holidayId = args[1];

    holidayMessageAndUser = await getMessageIdAndUser(holidayId).catch(e => Promise.reject({message: e.message}));

    const {startDate, endDate} = await getStartAndEndDate(msg).catch(e => Promise.reject({message: e.message}))

    const message = await msg.channel.messages.fetch(holidayMessageAndUser.messageId)
    await message.edit("HolidayId: " + holidayId + "\nUser: " + holidayMessageAndUser.user + " is AFK \nStart Date: " + startDate + "\nEnd Date: " + endDate);

    try {
        let holiday = {
            holiday_id: parseInt(holidayId),
            message_id: holidayMessageAndUser.messageId,
            member: holidayMessageAndUser.user,
            startDate,
            endDate
        }
        await storeUserHoliday(holiday)
    } catch (e) {
        console.log(e);
    }

    await msg.delete().catch((e) => Promise.reject({message: e.message}));
}

async function performHolidayCreate(client, msg, args) {
    let userTag = msg.author.tag;
    if (args[0] === "create") {
        if (args[1] && args[1].startsWith('<@')) {
            userTag = args[1].replace('<@', '');
            userTag = userTag.replace('!', '');
            userTag = userTag.replace('>', '');
            userTag = client.users.cache.get(userTag).tag;
        }

        const {startDate, endDate} = await getStartAndEndDate(msg).catch(e => Promise.reject({message: e.message}))

        try {
            let holidayId = await getLastHolidayId() + 1;

            const sentMessage = await msg.channel.send("HolidayId: " + holidayId + "\nUser: " + userTag + " is AFK \nStart Date: " + startDate + "\nEnd Date: " + endDate)

            let holiday = {
                holiday_id: parseInt(holidayId),
                message_id: sentMessage.id,
                member: userTag,
                startDate,
                endDate
            }
            await storeUserHoliday(holiday)
        } catch (e) {
            console.log(e);
        }

        await msg.delete().catch((e) => Promise.reject({message: e.message}));
    }
}

async function getStartAndEndDate(msg) {
    let startDate = await promptUserToEnterDate(msg, "Start").catch((e) => Promise.reject({message: e.message}));

    let endDate = await promptUserToEnterDate(msg, "End").catch((e) => Promise.reject({message: e.message}));

    return {startDate, endDate};
}

async function getMessageIdAndUser(holidayId) {
    let holidayMessageAndUser;
    try {
        if (! holidayId) {
            throw new Error();
        }
    } catch (e) {
        throw new Error("HolidayId not valid.");
    }

    holidayMessageAndUser = await getHolidayMessageAndUserById(parseInt(holidayId))

    if (! holidayMessageAndUser.messageId) {
        throw new Error("Unable to find matching Holiday post. \nPlease add the correct HolidayId after the edit argument. \nCheck #members-holidays-help for valid arguments");
    }

    return holidayMessageAndUser;
}

async function promptUserToEnterDate(msg, dateType) {

    let userDate;
    let infoMsg = await msg.reply(dateType + " Date (mm/dd/yyyy format)").then((result) => {
        return result
    }).catch(() => Promise.reject({message: "Error issuing command.  Contact @Admin"}));

    userDate = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {
        max: 1,
        time: 60000,
        errors: ['time']
    }).then(async (collected) => {
        console.log(collected)
        await infoMsg.delete().catch(e => {
            console.log(e.message)
        });
        return await verifyDate(collected.first()).catch(e => {
            throw(e)
        });
    }).catch((e) => {
        if (e.message === undefined) {
            return Promise.reject({message: "You took too long to respond.  Command has been cancelled.  Re-issue `!rb afk` to try again"})
        } else {
            return Promise.reject({message: e.message})
        }
    });

    return userDate;
}

async function verifyDate(message) {
    var dateString = message.content;
    await message.delete().catch(e => {
        console.log(e.message)
    });
    if (isInputFormatValid(dateString) && moment(dateString, "MM/DD/YYYY").isValid()) {
        return dateString;
    } else {
        return Promise.reject({message: "Invalid Date Entered. Dates must be entered in the following format: MM/DD/YYYY.  Command has been cancelled.  Re-issue `!rb afk` to try again"});
    }
}

function isInputFormatValid(input) {

    var pattern = /^\d{2}\/\d{2}\/\d{4}$/;

    if (! pattern.test(input)) {
        return false;
    }

    return true;
}
