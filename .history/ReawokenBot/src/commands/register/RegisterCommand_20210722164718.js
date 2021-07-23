const BaseCommand = require('../../utils/structures/BaseCommand');
require('dotenv').config({path: __dirname + '/.env'})

module.exports = class RegisterCommand extends BaseCommand {
    constructor() {
        super('register', 'user', []);
    }

    async run(client, msg) {
        if(msg.channel.id === process.env.REGISTER_HERE_CHANNEL){

            const Role = msg.guild.roles.cache
                .find(r => r.name === "Registered")

            msg.guild.members.cache
            .find(m => m.id === msg.author.id).roles
            .add(Role);
            }
    }
}