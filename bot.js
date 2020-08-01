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

  if (msg.content.toLowerCase() === "!rb inactive") {
  const authorized = await isMemberAuthroized(msg.member)
  .catch(e=>{
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
              const channelMessages = await getAllChannelMessages(channelList, msg).catch(e=>{
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
  
  
  
  if(error)
  {
    await msg.reply(error).catch(e=>{
      console.log(e.message);
    });
  }
  
});

client.login(process.env.BOT_TOKEN);

async function isMemberAuthroized(member)
{
  console.log("Member " + typeof(member));
  console.log("roles " + typeof(member.roles));
  console.log("roles cache" + typeof(member.roles.cache));
  if(await member.roles.cache.find(r => r.name === "Admin") || await member.roles.cache.find(r => r.name === "Admin-Top-Tier")){
    return true;
  }
  else{
    return Promise.reject({message: "User Not Authroized To Use Reawoken Bot"});
  }
}

async function getInactiveIDsAndSendInactiveUsersReply(msg, userRecentMsgs){
  var cutoffDate = new Date();
  let inactiveUsersMsg = [];
  let filteredUsers = [];
  cutoffDate.setDate(cutoffDate.getDate() - 14);
  filteredUsers = userRecentMsgs.filter(m => m.Date < cutoffDate );
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

async function getAllChannelMessages(channelList, initalMsg){
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
