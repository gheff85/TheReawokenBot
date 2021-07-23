const {MongoClient} = require('mongodb');
const Canvas = require('canvas');
const { MessageAttachment } = require('discord.js');
const path = require('path');
require('dotenv').config({path: __dirname + '/.env'})

async function generateExperience(msg){

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
  
    if((Date.now() - userStats.last_msg) < 30*1000 ) {
      return;
    }
  
    userStats.last_msg = Date.now();
    userStats.current_xp += 25;
  
    userStats.avatar = msg.author.displayAvatarURL({dynamic: false, format:"png"})
    userStats.nickname = await msg.guild.members.cache.find(u => u.id === msg.author.id).displayName
 
    if (userStats.current_xp >= userStats.xpOfNextLevel) {
        userStats.level++;
        switch (userStats.level) {
          case 1: userStats = updateRankOnUserStats(userStats, 'Fanatic', 'none');
              break;
          case 5: userStats = updateRankOnUserStats(userStats, 'Goblin', 'Fanatic');
              break;
          case 10: userStats = updateRankOnUserStats(userStats, 'Hobgoblin', 'Goblin');
              break;
          case 15: userStats = updateRankOnUserStats(userStats, 'Supplicant', 'Hobgoblin');
              break;
          case 20: userStats = updateRankOnUserStats(userStats, 'Harpy', 'Supplicant');
              break;
          case 25: userStats = updateRankOnUserStats(userStats, 'Minotaur', 'Harpy');
              break;
          case 30: userStats = updateRankOnUserStats(userStats, 'Praetorian', 'Minotaur');
              break;
          case 35: userStats = updateRankOnUserStats(userStats, 'Hydra', 'Praetorian');
              break;
          case 40: userStats = updateRankOnUserStats(userStats, 'Wyvern', 'Hydra');
              break;
          case 45: userStats = updateRankOnUserStats(userStats, 'Gorgon', 'Wyvern');
              break;
          case 50: userStats = updateRankOnUserStats(userStats, 'Templar', 'Gorgon');
              break;
          case 55: userStats = updateRankOnUserStats(userStats, 'Axis Mind', 'Templar');
              break;
          default: userStats.newRankAchieved = false;
              break;
      }
  
        userStats.current_xp = userStats.current_xp - userStats.xpOfNextLevel;
       
        userStats.xpOfNextLevel = Math.pow((userStats.level + 1), 2) + 20 * (userStats.level + 1) + 100;

  
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
        await generateRankCard(levelChannel, userStats, channelMessage).catch(e=> {console.log(e.message)});
    } else{
      await saveUserStats(userStats);
    }
}

function updateRankOnUserStats(userStats, rank, previousRank) {
  return {
      ... userStats,
      rank,
      newRankAchieved: true,
      previousRank
  }
}

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

async function getAllUserLevelData(){
  const client = new MongoClient(process.env.MONGODB_URI, {useUnifiedTopology: true});
  await client.connect().catch(e=>{
    console.log(e.message);
    return "Cannot connect to db";
  });

  const result = await client.db('clan_info').collection('levels').find({}).toArray();
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

async function storeError(error){
  const client = new MongoClient(process.env.MONGODB_URI, {useUnifiedTopology: true});
  await client.connect().catch(e=>{
    console.log(e.message);
    return "Cannot connect to db";
  });

  let errorDateTime = (new Date()).toISOString().slice(0,19).replace(/-/g,"/").replace("T", " ");

  const query = { errorDateTime};
  const update = { $set: { errorDateTime,
                           errorMessage: error.message,
                          errorStack: error}};
  const options = { upsert: true };
  const result = await client.db('clan_info').collection('errors').updateOne(query, update, options).catch(e=>{
    console.log(e.message);
    return "Unable to store error log";
  });

  await client.close().catch(e=> {console.log(e.message)});
  return result;
}

async function logLastUsersMessageTimestamp(userId, date){
    const client = new MongoClient(process.env.MONGODB_URI, {useUnifiedTopology: true});
    await client.connect().catch(e=>{
      console.log(e.message);
      return "Cannot connect to db";
    });
  
    const query = { user_id: userId };
    const update = { $set: { user_id: userId,
                             date: date}};
    const options = { upsert: true };
    const result = await client.db('clan_info').collection('discord_activity').updateOne(query, update, options).catch(e=>{
      console.log(e.message);
      return "Users last message date not saved";
    });
  
    await client.close().catch(e=> {console.log(e.message)});
    return result;
}

async function generateRankCard(channel, userStats, channelMessage){
    const canvas = Canvas.createCanvas(700, 250);
    const ctx = canvas.getContext('2d');
  
    let backgroundImage = path.resolve(__dirname,'../../lib/background.png');
    const background = await Canvas.loadImage(backgroundImage);
  
    ctx.drawImage(background, 0, 0);
    let nickName = userStats.nickname.split(" ")[0]
    ctx.font = '60px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(nickName, 300, 150, 395);
  
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
    for(var i=0; i< (roundedPercentage -1); i++) {
        ctx.beginPath();
        ctx.arc((xCo +  (i * 6.65)), (yCo), radius,0, (Math.PI *2), true)
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
    }
  
    if(!channelMessage){
      channelMessage='';
    }
  
    const attachment = new MessageAttachment(canvas.toBuffer());
    await channel.send(channelMessage, attachment);
}

async function getAllUsersLastMessageTimestamp(){
    const client = new MongoClient(process.env.MONGODB_URI, {useUnifiedTopology: true});
    await client.connect().catch(e=>{
      console.log(e.message);
      return "Cannot connect to db";
    });

    const result = await client.db('clan_info').collection('discord_activity').find({}).toArray()
    await client.close().catch(e=> {console.log(e.message)});
    return result;
}

 module.exports = {generateExperience, getUserStats, getAllUserLevelData, generateRankCard, logLastUsersMessageTimestamp, getAllUsersLastMessageTimestamp, storeError};