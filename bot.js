const Discord = require("discord.js");
const axios = require('axios').default;
var moment = require("moment");
const {MongoClient} = require('mongodb');
const Canvas = require('canvas');
const { MessageAttachment } = require('discord.js');

require('dotenv').config()
const client = new Discord.Client({ ws: { intents: new Discord.Intents(Discord.Intents.ALL) }});
  
client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`)
});

client.on("guildMemberRemove", async (member) =>{
  await deleteUserStats(member).catch(e=>{console.log(e.message)});
})

var awaitingResponse = [];
client.on("message", async(msg) => {
  var error;

  //if(msg.author.id === "749763074919235604"){
 // await msg.channel.send("<@749763074919235604> is a filthy casual and a dirty cheat");
//}

  if(msg.content.toLowerCase() === "!rb rankcard"){
    let userStats = await getUserStats(msg.author.id).catch(e => {
      console.log(e.message);
    });

    if(userStats && (userStats.level > 0)) {
      await generateRankCard(msg.channel, userStats, null).catch(e=> {console.log(e.message)});
    } else {
      await msg.channel.send("<@" + msg.author.id + "> You have not had enough Discord participation to be able to generate a rankcard")
    }
  }

  if(msg.channel.id === process.env.CHAT_CHANNEL || msg.channel.id === process.env.PVE_CHANNEL ||
     msg.channel.id === process.env.PVP_CHANNEL || msg.channel.id === process.env.RAIDS_CHANNEL && msg.content.toLowerCase() !== "!rb rankcard") {
    await generateExperience(msg).catch(e=>{console.log(e.message)});
  }

  if(awaitingResponse.includes(msg.author.id))
  {
    return;
  }

 
  /////////////////////////////assign role on register////////
  if(msg.channel.id === process.env.REGISTER_HERE_CHANNEL && msg.content.includes("!register")){

    const registeredRole = msg.guild.roles.cache.find(r => r.name === "Registered");
    await msg.guild.members.cache.find(m => m.id === msg.author.id).roles.add(registeredRole);
    }
   
  
  ////////Stop bot from replying to bots from this point on//////////
  if(msg.author.bot)
  {
    return;
  }

  /////////////////////////////!rb cc/////////////////////////
  if(msg.channel.id === process.env.REAWOKEN_COMMANDS_CHANNEL && msg.content.toLowerCase() === "!rb cc"){
    const authorized = await isMemberAuthroized(msg.member).catch(e=>{
      error = "isMemberAuth: " + e.message;
    });

    if(!error){
      awaitingResponse.push(msg.author.id);
      console.log("Member Authorised");

       const channelList = await addChannelToArray(msg.client.channels,
                                                         [process.env.CHAT_CHANNEL, 
                                                          process.env.PVE_CHANNEL,
                                                          process.env.PVP_CHANNEL,
                                                          process.env.RAIDS_CHANNEL]).catch(e=>{
                                                           error = "addChannelToArray: " + e.message;
                                                         });
      
      if(!error){
        let infoMsg = await msg.reply("Searching For Messages Older Than 21 Days....").then((result) => {return result}).catch(e=>{
          console.log(e.message);
        });
        const channelMessages = await getAllChannelMessages(channelList).catch(e=>{
          error = "getAllChannelMessages: " + e.message;
        });
      
        if(!error){
          messageArray = await getMessageAndDateArray(channelMessages).catch(e=>{
            error = "getMessageAndDateArray: " + e.message;
          });

          if(!error){
            console.log("Retrieved All Messages");
            const oldMgs = await getMessagesBeforeDate(messageArray, 21, false).catch(e=>{
              error = "getMessagesBeforeDate: " + e.message;
            });
            
            if (!error){
              let count = await deleteMessages(oldMgs.map(m=>m.Message), infoMsg, msg).catch(e=>{
                error = "deleteMessages: " + e.message;
              });
            
              if(!error){
                
                removeFromAwaitingResponse(msg.author.id);
                await infoMsg.delete().catch(e=>{console.log(e.message)});
                await msg.reply("Channel clean-up completed").catch(e=>{
                  console.log(e.message);
                });
              }
            }
          }
        }
      }
    }
  }
  


  /////////////////////////////!rb inactive/////////////////////////
  if (msg.channel.id === process.env.REAWOKEN_COMMANDS_CHANNEL && msg.content.toLowerCase() === "!rb inactive") {
    const authorized = await isMemberAuthroized(msg.member).catch(e=>{
      error = "isMemberAuth: " + e.message;
    });
    
    if(!error){
      awaitingResponse.push(msg.author.id);
      const Role = await getRole(msg.guild, "Registered").catch(e=>{
          error = "getRegisteredRole: " + e.message;
      });

      if(!error){
        const channelList = await addChannelToArray(msg.client.channels,
                                                        [process.env.CHAT_CHANNEL, 
                                                         process.env.PVE_CHANNEL,
                                                         process.env.PVP_CHANNEL,
                                                         process.env.RAIDS_CHANNEL]).catch(e=>{
                                                          error = "addChannelToArray: " + e.message;
                                                        });
       
        if(!error){
          const MemberIDs = await getAllMembersFromRole(msg.guild.members, Role).catch(e=>{
              error = "getAllMemebrsFromRole: " + e.message;
          });

          if(!error){
            const channelMessages = await getAllChannelMessages(channelList).catch(e=>{
                error = "getAllChannelMessages: " + e.message;
            });

            if(!error){
              const userRecentMsgs = await getLastMessageFromEveryMember(msg.guild.members, MemberIDs, channelMessages).catch(e => {
                  error = "getLastMessageFromEveryMember: " + e.message;
              });

              if(!error){
                const inactiveUsers = await getInactiveIDsAndSendInactiveUsersReply(msg, userRecentMsgs).catch(e=>{
                    error = "getInactiveIDsAndSend: " + e.message;
                });  

                if(!error){
                  removeFromAwaitingResponse(msg.author.id);
                  //await kickInactive(msg, inactiveUsers).catch(e =>{
                  //    error = "addInactiveStatus: " + e.message;
                  //});
                }
              }
            }
          }
        }
      }
    }
  }

  /////////////////////////////!rb afk/////////////////////////
  if (msg.channel.id === process.env.MEMBERS_HOLIDAY_CHANNEL && msg.content.toLowerCase() === "!rb afk") {
    
    var startDate;
    var endDate;
    awaitingResponse.push(msg.author.id);

    let infoMsg = await msg.reply("Start Date (mm/dd/yyyy format)").then((result) => {return result}).catch(e=>{
      error = e.message;
    });
    
    if(!error){
      startDate = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {max:1, time:45000, errors: ['time']}).then(async (collected) => {
        await infoMsg.delete().catch(e=>{console.log(e.message)});
        return await verifyDate(collected.first(), msg, infoMsg, 1).catch(e => {throw(e)});
      }).catch(async (e) => {
        
        error = e.message;
        if(!error){
          error = "Command Timed out";
        }
      });

      if(!error){
        
        infoMsg = await msg.reply("End Date (mm/dd/yyyy format)").then((result) => {return result}).catch(e=>{
          error = e.message;
        });

        if(!error){
          endDate = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {max:1, time:45000, errors:['time]']}).then(async (collected) => {
            await infoMsg.delete().catch(e=>{console.log(e.message)});
            return await verifyDate(collected.first(), msg, infoMsg, 1).catch(e => {throw(e)});
          }).catch(async (e)=>{
            error = e.message;
            if(!error){
              error = "Command Timed out";
            }
          });
          
          if(moment(endDate, "MM/DD/YYYY").isBefore(moment(startDate, "MM/DD/YYYY"))){
            error = "End Date is before Start Date. AFK Creation Cancelled"
          }

          if(!error){
            removeFromAwaitingResponse(msg.author.id);
            await msg.channel.send("User: " + msg.author.tag + " is AFK \nStart Date: " + startDate + "\nEnd Date: " + endDate).catch(e=>{console.log(e.message)});
            await msg.delete().catch(e=>{console.log(e.message)});
          }
        }
      }
    }
  }
      
  /////////////////////////////////!rb compare//////////////////////////////////////
  if (msg.channel.id === process.env.REAWOKEN_COMMANDS_CHANNEL && msg.content.toLowerCase() === "!rb compare") {
    const authorized = await isMemberAuthroized(msg.member).catch(e=>{
        error = "isMemberAuth: " + e.message;
    });

    let notInClan = [];
    let notInDiscord = [];
    let notRegistered = [];

    if(!error){
      awaitingResponse.push(msg.author.id);
      const Role = await getRole(msg.guild, "Registered").catch(e=>{
          error = "getRegisteredRole: " + e.message;
      });

      if(!error){
        const registeredMemberIDs = await getAllMembersFromRole(msg.guild.members, Role).catch(e=>{
           error = "getAllMemebrsFromRole: " + e.message;
        });
        
        if(!error){
          const MemberIDs = await getAllDiscordMembers(msg.guild.members).catch(e=>{
              error = "getAllMemebrsFromRole: " + e.message;
          });

          if(!error){
            const clanMembers = await getClanMembers().catch(e=>{
              error = "getAllMemebrsFromRole: " + e.message;
            });

            if(!error){

              notInClan = await getNotInClan(clanMembers, MemberIDs).catch(e=>{
                error = "Error finding members not in Clan";
              });

              if(!error){
                notInDiscord = await getNotInDiscord(clanMembers, MemberIDs).catch(e=>{
                  error = "Error finding members not in Discord";
                });

                if(!error) {
                  notRegistered = await getNotRegistered(registeredMemberIDs, MemberIDs).catch(e=>{
                    error = "Error finding not registered";
                  });
                  
                  if(!error) {
                    removeFromAwaitingResponse(msg.author.id);
                    await msg.reply("The following members are in Discord but not the clan:\n`"+ notInClan.join('\n') +"`")
                    .catch((e) => Promise.reject({message: e.message}));

                    await msg.reply("The following members are in the Clan but not in Discord:\n`"+ getNotInDiscordText(notInDiscord) +"`")
                    .catch((e) => Promise.reject({message: e.message}));
                    
                    await msg.reply("The following members are not registered in Discord:\n`"+ notRegistered +"`")
                    .catch((e) => Promise.reject({message: e.message}));
                  }
                }
              }
            }
          }
        }
      }
    }
  }

   /////////////////////////////Reply to message with error/////////////////////////
  if(error)
  {
    removeFromAwaitingResponse(msg.author.id);
    await msg.reply(error).catch(e=>{
      console.log(e.message);
    });
  }
});

async function getUserStats(id){
  const client = new MongoClient(process.env.MONGODB_URI, {useUnifiedTopology: true});
  await client.connect().catch(e=>{
    console.log(e.message);
    return "Cannot connect to db";
  });

  const result = await client.db('clan_info').collection('levels').findOne({ user_id: id });
  await client.close().catch(e=> {console.log(e.message)});
  return result;
}

async function saveUserStats(userStats){
  const client = new MongoClient(process.env.MONGODB_URI, {useUnifiedTopology: true});
  await client.connect().catch(e=>{
    console.log(e.message);
    return "Cannot connect to db";
  });

  const query = { user_id: userStats.user_id };
  const update = { $set: { user_id: userStats.user_id,
                           avatar: userStats.avatar,
                           nickname: userStats.nickname,
                           current_xp: userStats.current_xp,
                           xpOfNextLevel: userStats.xpOfNextLevel,
                           level: userStats.level,
                           rank: userStats.rank,
                           newRankAchieved: userStats.newRankAchieved,
                           previousRank: userStats.previousRank,
                           last_msg: userStats.last_msg}};
  const options = { upsert: true };
  const result = await client.db('clan_info').collection('levels').updateOne(query, update, options).catch(e=>{
    console.log(e.message);
    return "User stats not saved";
  });

  await client.close().catch(e=> {console.log(e.message)});
  return result;
}

async function deleteUserStats(member){
  const client = new MongoClient(process.env.MONGODB_URI, {useUnifiedTopology: true});
  await client.connect().catch(e=>{
    console.log(e.message);
    return "Cannot connect to db";
  });

  await client.db('clan_info').collection('levels').deleteOne( { "user_id" : member.id } ).catch(e=>{
    console.log(e.message);
    return "User stats not saved";
  });

  await client.close().catch(e=> {console.log(e.message)});
}

async function generateExperience(msg){

  if(msg.author.bot){
    return;
  }

  let userStats = await getUserStats(msg.author.id).catch(e => {
    console.log(e.message);
  });


  if(userStats && userStats.toString().includes("Cannot connect to db")){
    return;
  }

 if(!userStats){
    userStats = {
      user_id: msg.author.id,
      avatar: "",
      nickname: "",
      current_xp:0,
      xpOfNextLevel:100,
      level:0,
      rank:"",
      newRankAchieved: false,
      previousRank:"none",
      last_msg:0
    };
  }

  if((Date.now() - userStats.last_msg) < 120*1000 ) {
    return;
  }

  userStats.last_msg = Date.now();
  userStats.current_xp += 25;

  let avatar = msg.author.displayAvatarURL({dynamic: false, format:"png"})
  if(avatar){
    userStats.avatar = avatar;
  }
  else {
    userStats.avatar = './discord-logo.png';
  }

  if (userStats.current_xp >= userStats.xpOfNextLevel) {
      userStats.level++;
      switch(userStats.level){
        case 1:
          userStats.rank = "Shank";
          userStats.newRankAchieved = true;
          break;
        case 5:
          userStats.rank = "Dreg";
          userStats.newRankAchieved = true;
          userStats.previousRank = "Shank";
          break;
        case 10:
          userStats.rank = "Vandal";
          userStats.newRankAchieved = true;
          userStats.previousRank = "Dreg";
          break;
        case 15:
          userStats.rank = "Captain";
          userStats.newRankAchieved = true;
          userStats.previousRank = "Vandal";
          break;
        case 20:
          userStats.rank = "Servitor";
          userStats.newRankAchieved = true;
          userStats.previousRank = "Captain";
          break;
        case 25:
          userStats.rank = "Archon";
          userStats.newRankAchieved = true;
          userStats.previousRank = "Servitor";
          break;
        case 30:
          userStats.rank = "Kell";
          userStats.newRankAchieved = true;
          userStats.previousRank = "Archon";
          break;
        default:
          userStats.newRankAchieved = false;
          break;
      }

      userStats.current_xp = userStats.current_xp - userStats.xpOfNextLevel;
      //if(userStats.current_xp < 10){
      //  userStats.current_xp = 10;
      //}
      userStats.xpOfNextLevel = Math.pow((userStats.level + 1), 2) + 20 * (userStats.level + 1) + 100;
      userStats.nickname = await msg.guild.members.cache.find(u => u.id === msg.author.id).displayName,

      await saveUserStats(userStats);
      const currentRank = msg.guild.roles.cache.find(r => r.name === userStats.rank);
      if(userStats.previousRank !== "none") {
        const previousRank = msg.guild.roles.cache.find(r => r.name === userStats.previousRank);
        await msg.guild.members.cache.find(m => m.id === msg.author.id).roles.remove(previousRank);
      }
      await msg.guild.members.cache.find(m => m.id === msg.author.id).roles.add(currentRank);
      let channelMessage = "Congratulations, <@" + userStats.user_id + "> you have reached level: " + userStats.level

      if(userStats.newRankAchieved) {
        channelMessage = channelMessage + " and achieved the rank of: " + userStats.rank;
      }

      const levelChannel = await msg.guild.channels.cache.get(process.env.MEMBER_LEVEL_RANK_UP_CHANNEL);
      generateRankCard(levelChannel, userStats, channelMessage);
  } else{
    userStats.nickname = await msg.guild.members.cache.find(u => u.id === msg.author.id).displayName;
    await saveUserStats(userStats);
  }
}

function getNotInDiscordText(notInDiscord){
    var text = '';
    for(member of notInDiscord){
      text += '{' + member.displayName + ', ' + member.lastSeenDisplayName + '}\n';
    }
    return text;
}

async function getNotInClan(clanMembers, MemberIDs){
  var results = [];
  for(var member of MemberIDs){
    if(!clanMembers.map(c=>c.lastSeenDisplayName.toLowerCase()).includes(member.DisplayName.toLowerCase()) &&
       !clanMembers.map(c=>c.displayName.toLowerCase()).includes(member.DisplayName.toLowerCase())){
      results.push(member.DisplayName);
    }
  }

  return results;
}

async function getNotRegistered(registeredMembers, AllMemberIDs){
  var regDisplayName = [];
  var AllMembers = [];

  for(var member of registeredMembers) {
    regDisplayName.push(member.DisplayName);
  }

  for(var member of AllMemberIDs) {
    AllMembers.push(member.DisplayName);
  }

  var results = '';
  var differences = AllMembers.filter(x => !regDisplayName.includes(x));

  for(var member of differences){
    results += member + '\n';
  }

  return results;
}

async function getNotInDiscord(clanMembers, MemberIDs){
  var results = [];
  for(var member of clanMembers){
    if((MemberIDs.filter(m => m.DisplayName.toLowerCase() == member.lastSeenDisplayName.toLowerCase()).length == 0) &&
       (MemberIDs.filter(m => m.DisplayName.toLowerCase() == member.displayName.toLowerCase()).length == 0)){
      results.push(member);
    }
  }

  return results;
}

async function getClanMembers(){
  var apiKey = process.env.BUNGIE_API_KEY;
  let config = {
    headers: {
      'X-API-Key': apiKey,
    }
  }

  let resp = await axios.get(process.env.GET_MEMBERS_ENDPOINT, config).then(r => {
  let memberList = [];
  var memberResults =r.data.Response.results;
    for(var member of memberResults){
      memberList.push({lastSeenDisplayName: member.destinyUserInfo.LastSeenDisplayName, displayName: member.destinyUserInfo.displayName})
    }
    return memberList;
  }).catch(e=> {
    var error1 = e.message;
  })

  return resp;
}

async function getUserHolidays(msg){
  var result = [];
  const holidayChannelId = process.env.MEMBERS_HOLIDAYS_CHANNEL
  const holChannel = await addChannelToArray(msg.client.channels,
    [holidayChannelId]).catch(e=>{
      error = "addChannelToArray: " + e.message;
    });
  const holidayMsgs = await getAllChannelMessages(holChannel).catch(e=>{
    console.log(e.message);
  })

  for(var message of holidayMsgs){
    if(message.content.substring(0,4) == 'User'){
      var isIndex = message.content.indexOf(' is ');
      var user = message.content.substring(6, isIndex);
      var startIndex = message.content.indexOf('Start Date');
      var startDate = moment(message.content.substring(startIndex + 12, startIndex + 22), 'MM/DD/YYYY');
      startIndex = message.content.indexOf('End Date');
      var endDate = moment(message.content.substring(startIndex + 10, startIndex + 20), 'MM/DD/YYYY');

      if(startDate.isBefore(moment()) && endDate.isAfter(moment()) ){
        result.push(msg.client.users.cache.find(u=>u.tag == user).id);
      }
    };
  }

  return result;

}

function removeFromAwaitingResponse(userID){
  var index = awaitingResponse.indexOf(userID);
  awaitingResponse.splice(index,1);
}

async function verifyDate(message, msg, infoMsg, attempt){
  var dateString = message.content;

    if(isInputFormatValid(dateString) && moment(dateString, "MM/DD/YYYY").isValid()){
      if(!moment(dateString, "MM/DD/YYYY").isBefore(moment())){
        await message.delete().catch(e=>{console.log(e.message)});
        return dateString;
      }
      else{
        if(attempt > 2){
          throw({message: "Invalid Date: AFK Event Creation Cancelled"});
        }
        infoMsg = await msg.reply("Date has already passed, please enter a Date in the future in the following format: mm/dd/yyyy").then((result) => {return result}).catch(e=>{
          console.log(e.message);
        });
        attempt++;
        dateString = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {max:1, time:45000, errors:['time']}).then(async (collected) => {
          await infoMsg.delete().catch(e=>{console.log(e.message)});
          return await verifyDate(collected.first(), msg, infoMsg, attempt).catch(e=> {throw(e)});
        }).catch(async (e)=>{
            if(!e.message){
              return Promise.reject({message: "Command Timed Out"});
            }
            else{
              return Promise.reject({message: e.message});
            }
          });
      }
    }
    else{
      await message.delete().catch(e=>{console.log(e.message)});
      if(attempt > 2){
        throw({message: "Invalid Date: AFK Event Creation Cancelled"});
      }
      infoMsg = await msg.reply("Invalid Date, please enter a Date in the following format: mm/dd/yyyy").then((result) => {return result}).catch(e=>{
        console.log(e.message);
      });
      attempt++;
      dateString = await msg.channel.awaitMessages(m => m.author.id == msg.author.id, {max:1, time:45000, errors:['time']}).then(async (collected) => {
        await infoMsg.delete().catch(e=>{console.log(e.message)});
        return await verifyDate(collected.first(), msg, infoMsg, attempt).catch(e => {throw(e)});
      }).catch(async (e)=>{
          if(!e.message){
            return Promise.reject({message: "Command Timed Out"});
          }
          else{
            return Promise.reject({message: e.message});
          }
        });
    }

    return dateString;
}

function isInputFormatValid(input){

  var pattern = /^\d{2}\/\d{2}\/\d{4}$/;

  if(!pattern.test(input)){
    return false;
  }

  return true;
}

async function getMessageAndDateArray(channelMessages){
  let results = [];
  for(var message of channelMessages){
    results.push({Message:message, Date: new Date(message.createdTimestamp)});
  }

  return results;
}

async function deleteMessages(messageList, infoMsg, msg){
  let count =0;
  await infoMsg.delete();
  infoMsg = msg.reply("Deleting " + (messageList.length) + " Messages...");
  for(var message of messageList)
  {
    await message.delete({timeout: 1500}).then(() => {count = count + 1; console.log("Message Deleted");}).catch((e) => Promise.reject({message: e.message}));
  }

  return count;
}

async function isMemberAuthroized(member){
  if(await member.roles.cache.find(r => r.name === "Admin") || await member.roles.cache.find(r => r.name === "Admin-Top-Tier")){
    return true;
  }
  else{
    return Promise.reject({message: "User Not Authroized To Use Reawoken Bot"});
  }
}

async function getMessagesBeforeDate(messagesList, numberOfDays, memberData){
  let filteredMgs = [];
  var cutoffDate = new Date();
  var newMemberLeeway = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - numberOfDays);
  newMemberLeeway.setDate(newMemberLeeway.getDate() - 7);

  if(memberData){

  filteredMgs = messagesList.filter(m => m.Date.getTime() < cutoffDate.getTime() ).filter(m => m.JoinedDate.getTime() < newMemberLeeway.getTime() );
  }
  else{
    filteredMgs = messagesList.filter(m => m.Date.getTime() < cutoffDate.getTime() )
  }

  return filteredMgs;
}

async function getInactiveIDsAndSendInactiveUsersReply(msg, userRecentMsgs){

  let inactiveUsersMsg = [];
  let filteredUsers = [];
  const MembersOnHoliday = await getUserHolidays(msg).catch(e=>{
    console.log(e.message);
  })

  filteredUsers = await getMessagesBeforeDate(userRecentMsgs, 21, true)
  .catch((e) => Promise.reject({message: e.message}));
  filteredUsers = filteredUsers.filter(u => !MembersOnHoliday.includes(u.UserID));

  inactiveUsersMsg = filteredUsers.map(elm => {
    var lastActivity;
    if(elm.Date.getTime() === new Date(2020, 1).getTime()){
      lastActivity = "No Activity Recorded"
    }
    else{
      lastActivity = elm.Date;
    }
 return `${elm.DisplayName}  lastActive: ${lastActivity}`});
 if(filteredUsers.length > 0)
 {
    await msg.reply("The following members have been marked as inactive to be removed from the clan:\n`"+ inactiveUsersMsg.join('\n') +"`")
    .catch((e) => Promise.reject({message: e.message}));
    return filteredUsers.map(elm => elm.UserID);
 }
 else{
   return Promise.reject({message: "No Inactive Members Found"});
 }

}

async function getLastMessageFromEveryMember(guildMembers, MemberIDs, channelMessages){
  let results=[];

  for(var memberID of MemberIDs)
  {
      results.push(await getLastUserMessage(guildMembers, channelMessages, memberID.user_id)
      .catch((e) => Promise.reject({message: e.message})));
  }

  return results;
}

async function getAllMembersFromRole(members, role){

  return await members.cache.filter(m => m.roles.cache.find(r => r == role)).filter(u => u.user.bot === false)
                                                      .map(m => {return {user_id: m.user.id, user_tag: m.user.tag, DisplayName: m.displayName, JoinedDate: m.joinedAt}});
}

async function getAllDiscordMembers(members){
  return await members.cache.filter(u => u.user.bot === false)
                                                      .map(m => {return {user_id: m.user.id, user_tag: m.user.tag, DisplayName: m.displayName, JoinedDate: m.joinedAt}});
}

async function addChannelToArray(channels, channelArray){
  let results = [];

  for(var channel of channelArray){
    results.push(await channels.cache.get(channel));
  }

  return results;
}

async function getRole(guild, roleName){
   return await guild.roles.cache.find(r=>r.name == roleName);
}

async function kickInactive(initalMessage, inactiveMembers){
   for(var member of inactiveMembers)
   {
      await initalMessage.guild.members.cache.get(member).kick()
      .catch((e) => Promise.reject({message: e.message}));
   }
}

async function getLastUserMessage(guildMembers, channelMessages, userID){
  let result;
  const member = await guildMembers.cache.get(userID);
  const nickname = member.nickname;
  const userName = member.user.username;
  const displayName = member.displayName;
    const msgs = await channelMessages.filter(m => m.author.id === userID);
    if(msgs.length > 0){

    var first = msgs.sort(function(a,b){
      return new Date(b.createdTimestamp) - new Date(a.createdTimestamp);
    })[0];

      result = {Username: first.author.tag, DisplayName: displayName, UserID: userID, Date:new Date(first.createdTimestamp), JoinedDate: member.joinedAt };
    }
    else{
      result = {Username: userName, DisplayName: displayName,  UserID: userID, Date: new Date(2020, 1), JoinedDate: member.joinedAt};
    }

    return result;
}

async function getAllChannelMessages(channelList){
  const messageList = [];
  let last_id;

  for(var channel of channelList)
  {
    while(true)
    {
      const options = {limit:100};
      if(last_id){
        options.before = last_id;
      }

      const messages = await channel.messages.fetch(options)
      .catch((e) =>
       Promise.reject({message: e.message}));

      if(messages.size > 0)
      {
        messageList.push(...messages.array());
        last_id = messages.last().id;
      }
      if(messages.size != 100){
        break;
      }
    }
    last_id = undefined;
  }

  return messageList;
}

async function generateRankCard(channel, userStats, channelMessage){
  const canvas = Canvas.createCanvas(700, 250);
  const ctx = canvas.getContext('2d');

  const background = await Canvas.loadImage('./background.png');

  ctx.drawImage(background, 0, 0);

  ctx.font = '60px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(userStats.nickname, 300, 150, 395);

  ctx.font = '40px sans-serif';
  ctx.fillStyle = '#F4D03F';
  let rankTextStart = 690 - ctx.measureText(userStats.rank).width;
  ctx.fillText(userStats.rank, rankTextStart, 50);

  let rankLabelStart = rankTextStart - 65;
  ctx.font = '25px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText("Rank: ", rankLabelStart, 50);

  ctx.font = '25px sans-serif';
  ctx.fillText("lv: ", 15, 50);

  ctx.font = '40px sans-serif';
  ctx.fillStyle= '#F4D03F';
  let levelTextStart = 45;
  ctx.fillText(userStats.level, levelTextStart, 50);

  //save context before clipping
  ctx.save();
  ctx.beginPath();
  ctx.arc(190, 125, 50, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();

  const avatar = await Canvas.loadImage(userStats.avatar);

  ctx.drawImage(avatar, 140, 75, 100, 100);
  ctx.restore();

  ctx.font = '25px sans-serif';
  let xpText = userStats.current_xp + "/" + userStats.xpOfNextLevel;
  let xpTextStart = 690 - ctx.measureText(xpText).width;
  ctx.font = '25px sans-serif';
  ctx.fillText(xpText, xpTextStart, 190);

  let radius = 15;
  let xCo = 15 + radius;
  let yCo = 200 + radius;
  let width = 665;
  let height = 30;

  ctx.strokeStyle = "rgb(120, 120, 120)";
  ctx.fillStyle = "rgba(120, 120, 120, 1)";
  //ctx.beginPath();
  //ctx.moveTo(xCo + radius, yCo);
  //ctx.lineTo(xCo + width - radius, yCo);
  //ctx.quadraticCurveTo(xCo + width, yCo, xCo + width, yCo + radius);
  //ctx.lineTo(xCo + width, yCo + height - radius);
  //ctx.quadraticCurveTo(xCo + width, yCo + height, xCo + width - radius, yCo + height);
  //ctx.lineTo(xCo + radius, yCo + height);
  //ctx.quadraticCurveTo(xCo, yCo + height, xCo, yCo + height - radius);
  //ctx.lineTo(xCo, yCo + radius);
  //ctx.quadraticCurveTo(xCo, yCo, xCo + radius, yCo);
  //ctx.closePath();
  //ctx.stroke();
  //ctx.fill();
  
  for(var i=0; i< 99; i++) {
    ctx.beginPath();
    ctx.arc((xCo + (i * 6.65)), (yCo), radius,0, (Math.PI *2), true)
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
  }
  
let roundedPercentage = Math.floor((userStats.current_xp/userStats.xpOfNextLevel) * 100);
  ctx.strokeStyle = "rgb(255,165,0)";
  ctx.fillStyle = "rgba(255, 165, 0, 1)";

  for(var i=0; i<= roundedPercentage; i++) {
    //if((xCo + (i * 6.65)) <= width){
      ctx.beginPath();
      ctx.arc((xCo +  (i * 6.65)), (yCo), radius,0, (Math.PI *2), true)
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
    //}
  }

  if(!channelMessage){
    channelMessage='';
  }

  const attachment = new MessageAttachment(canvas.toBuffer());
  await channel.send(channelMessage, attachment);
}

client.login(process.env.BOT_TOKEN);
