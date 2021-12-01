const BaseCommand = require('../../utils/structures/BaseCommand');
const {getAllUserLevelData, storeError} = require("../../utils/common/commonFunctions");
const {MessageEmbed} = require("discord.js");

module.exports = class LeaderboardCommand extends BaseCommand {
    constructor() {
        super('leaderboard', 'user', []);
    }

    async run(client, msg) {
        try {
            if (msg.channel.id === process.env.STAT_CHECKER_CHANNEL) {
                let userId = msg.author.id

                let userLevelData = await getAllUserLevelData().catch((e) => Promise.reject({message: e.message}));

                let position = 0;

                let sortedLevelData = userLevelData.sort((a, b) => {
                    const compareLevels = (a, b) => b.level - a.level;
                    const compareXp = (a, b) => b.current_xp - a.current_xp


                    return compareLevels(a, b) || compareXp(a, b);
                }).filter(u => u.level > 0)

                if (sortedLevelData.length > 0) {

                    sortedLevelData = sortedLevelData.map((d, index, arr) => {
                        if (position === 0) {
                            position++;
                        } else if ((d.rank !== arr[index - 1].rank) || (d.level !== arr[index - 1].level)) {
                            position++;
                        }

                        return {
                            position: position,
                            userId: d.user_id,
                            nickname: d.nickname.split(' ')[0],
                            rank: d.rank,
                            level: d.level,
                            avatar: d.avatar
                        }
                    });

                    let currentUser = sortedLevelData.filter(u => u.userId === userId)[0];

                    sortedLevelData = sortedLevelData.splice(0, 10)


                    const embed = new MessageEmbed().setColor(0x4286f4).setTitle(`**Reawoken Rank Leaderboard**`).addField(`\u200b`, `\u200b`, false).addFields((sortedLevelData.map((user) => {
                        if (currentUser && user.userId === currentUser.userId) {
                            return {
                                    name: `**${
                                    user.position
                                }) ${
                                    user.nickname
                                } lv: ${
                                    user.level
                                } (${
                                    user.rank
                                })**`,
                                value: `\u200b`,
                                inline: false
                            };
                        } else {
                            return {
                                    name: `**${
                                    user.position
                                })** ${
                                    user.nickname
                                } **lv**: ${
                                    user.level
                                } (${
                                    user.rank
                                })`,
                                value: `\u200b`,
                                inline: false
                            };
                        }
                    })));

                    if (currentUser && sortedLevelData.filter(u => u.userId === userId).length === 0) {
                        embed.addField(`...`, `\u200b`, false)
                        embed.addField(`**${
                            currentUser.position
                        })** ${
                            currentUser.nickname
                        } **lv**: ${
                            currentUser.level
                        } (${
                            currentUser.rank
                        })`, `\u200b`, false)
                    }

                    msg.channel.send(embed)
                } else {
                    msg.channel.send('Not enough data available to generate the leaderboard')
                }
            }
        } catch (e) {
            msg.channel.send('Error occurred generating leaderboard - contact <@Admin>')
            console.log(e.message)
            storeError(e).then(res => console.log(res)).catch(e => console.log(e));
        }
    }
}
