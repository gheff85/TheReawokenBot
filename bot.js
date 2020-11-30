const Discord = require("discord.js");
const client = new Discord.Client();


client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`)
});

client.on("message", async(msg) => {
  let error;

  if(msg.author.bot)
  {
    return;
  }
  
  /////////////////////////////!rb cc/////////////////////////
  if(msg.content.toLowerCase() === "!rb cc"){
    const authorized = await isMemberAuthroized(msg.member).catch(e=>{
      error = "isMemberAuth: " + e.message;
    });

    if(!error){
      console.log("Member Authorised");
      const channelMessages = await getAllChannelMessages([msg.channel]).catch(e=>{
        error = "getAllChannelMessages: " + e.message;
      });
      
      messageArray = await getMessageAndDateArray(channelMessages).catch(e=>{
        error = "getMessageAndDateArray: " + e.message;
      });
      console.log("Retrieved All Messages");
      const oldMgs = await getMessagesBeforeDate(messageArray, 14).catch(e=>{
        error = "getMessagesBeforeDate: " + e.message;
      });
      console.log("Filtered Messages younger than 13 days");
      if (!error){
        let count = await deleteMessages(oldMgs.map(m=>m.Message)).catch(e=>{
          error = "deleteMessages: " + e.message;
        });
        
        if(!error){
           msg.reply("Deleted " + count + " Messages").catch(e=>{
            console.log(e.message);
           });
        }
      }
    }
  }
  


  /////////////////////////////!rb inactive/////////////////////////
  if (msg.content.toLowerCase() === "!rb inactive") {
  const authorized = await isMemberAuthroized(msg.member).catch(e=>{
			 
      error = "isMemberAuth: " + e.message;
    });
    
    if(!error){
      const inactiveRole = await getRole(msg.guild, "Inactive").catch(e=>{
        error = "getInactiveRole: " + e.message;
      });
    
      if(!error){
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
                    await addInactiveStatus(msg, inactiveUsers, inactiveRole).catch(e =>{
                      error = "addInactiveStatus: " + e.message;
                    });
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
    await msg.reply(error).catch(e=>{
      console.log(e.message);
    });
  }
  
});

client.login(process.env.BOT_TOKEN);

async function getMessageAndDateArray(channelMessages){
  let results = [];
  for(var message of channelMessages){
    results.push({Message:message, Date: new Date(message.createdTimestamp)});
  }

  return results;
}

async function deleteMessages(messageList){
 let count =0;
  for(var message of messageList)
  {
    await message.delete({timeout: 1500}).then(count = count + 1; console.log("Message Deleted");).catch((e) => Promise.reject({message: e.message}));

  }

return count;
}

async function isMemberAuthroized(member)
{
  if(await member.roles.cache.find(r => r.name === "Admin") || await member.roles.cache.find(r => r.name === "Admin-Top-Tier")){
    return true;
  }
  else{
    return Promise.reject({message: "User Not Authroized To Use Reawoken Bot"});
  }
}

async function getMessagesBeforeDate(messagesList, numberOfDays){
  let filteredMgs = [];
  var cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - numberOfDays);
  filteredMgs = messagesList.filter(m => m.Date < cutoffDate );

  return filteredMgs;
}

async function getInactiveIDsAndSendInactiveUsersReply(msg, userRecentMsgs){
  
  let inactiveUsersMsg = [];
  let filteredUsers = [];

  filteredUsers = await getMessagesBeforeDate(userRecentMsgs, 7)
  .catch((e) => Promise.reject({message: e.message}));

  inactiveUsersMsg = filteredUsers.map(elm => 
 `${elm.DisplayName}  lastActive: ${elm.Date.toLocaleString()}`);
 if(filteredUsers.length > 0)
 {
    await msg.reply("The following members have been marked as inactive:\n`"+ inactiveUsersMsg.join('\n') +"`")
    .catch((e) => Promise.reject({message: e.message}));
    return filteredUsers.map(elm => elm.UserID);
 }
 else{
   return Promise.reject({message: "No Inactive Members Found"});
 }
  
}

async function getLastMessageFromEveryMember(guildMembers, MemberIDs, channelMessages)
{
  let results=[];

  for(var memberID of MemberIDs)
  {
      results.push(await getLastUserMessage(guildMembers, channelMessages, memberID)
      .catch((e) => Promise.reject({message: e.message})));
  }

  return results;
}

async function getAllMembersFromRole(members, role){

  return await members.cache.filter(m => m.roles.cache.find(r => r == role)).filter(u => u.user.bot === false)
                                                      .map(m => m.user.id);
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

async function addInactiveStatus(initalMessage, inactiveMembers, inactiveRole)
{
   for(var member of inactiveMembers)
   {
      await initalMessage.guild.members.cache.get(member).roles.add(inactiveRole)
      .catch((e) => Promise.reject({message: e.message}));
   }
}

async function getLastUserMessage(guildMembers, channelMessages, userID)
{
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

      result = {Username: first.author.tag, DisplayName: displayName, UserID: userID, Date:new Date(first.createdTimestamp) };
    }
    else{
      result = {Username: userName, DisplayName: displayName,  UserID: userID, Date: new Date()};
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
