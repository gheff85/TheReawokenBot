const BaseCommand = require('../../utils/structures/BaseCommand');
require('dotenv').config({path: __dirname + '/.env'})
var moment = require("moment");

module.exports = class AfkCommand extends BaseCommand {
    constructor() {
        super('afk', 'user', []);
    }

    async run(client, msg, args) {
        if(msg.channel.id === process.env.MEMBERS_HOLIDAY_CHANNEL){

            let startDate = await promtUserToEnterDate(msg, "Start")
            .catch((e) => Promise.reject({message: e.message}));

            let endDate = await promtUserToEnterDate(msg, "End")
            .catch((e) => Promise.reject({message: e.message}));

            await msg.channel
            .send("User: " + msg.author.tag + " is AFK \nStart Date: " + startDate + "\nEnd Date: " + endDate)
            .catch(e=>{console.log(e.message)});
            await msg.delete()
            .catch((e) => Promise.reject({message: e.message}));
        }
    }
}

async function promtUserToEnterDate(msg, dateType){
    
    let userDate;
    let infoMsg = await msg.reply(dateType + " Date (mm/dd/yyyy format)")
    .then((result) => {return result})
    .catch((e) => Promise.reject({message: "Error issuing command.  Contact @Admin"}));

    userDate = await msg.channel
    .awaitMessages(m => m.author.id == msg.author.id, {max:1, time:60000, errors: ['time']})
    .then(async (collected) => {
        await infoMsg.delete().catch(e=>{console.log(e.message)});
        return await verifyDate(collected.first()).catch(e => {throw(e)});
      })
    .catch((e) => Promise.reject({message: e.message}));

    return userDate;
}

async function verifyDate(message){
    var dateString = message.content;
    await message.delete().catch(e=>{console.log(e.message)});
    if(isInputFormatValid(dateString) && moment(dateString, "MM/DD/YYYY").isValid()){
        return dateString;
    }
    else{
        return Promise.reject({message: "Invalid Date Entered. Dates must be entered in the following format: MM/DD/YYYY.  Command has been cancelled.  Re-issue `!rb afk` to try again"});
    }
}

  function isInputFormatValid(input){

    var pattern = /^\d{2}\/\d{2}\/\d{4}$/;
  
    if(!pattern.test(input)){
      return false;
    }
  
    return true;
  }