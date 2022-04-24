const { MessageActionRow, MessageButton, Message, Client } = require('discord.js')
const FindUser = require('../../functions/findUser.js')
const Loop = require('../../functions/loop.js')

module.exports = {
    mainCommand: 'profile',
    name: 'add',
    arguments: ['name', 'server'],
    description: 'Add lol profile to your discord account',
    /**
     * 
     * @param {Client} client
     */
    setup: function (client, reload = false) {
        if (reload) return

        client.on('interactionCreate', async (interaction) => {
            if (!interaction.isButton()) return
            let id = interaction.customId
            let split = id.split('@')
            let fromCommand = split[0]
            if (fromCommand != 'PROFILE_ADD') return

            let name = split[1]
            let server = split[2]
            let channelId = split[3]
            let original_message_id = split[4]

            let channel = await interaction.client.channels.fetch(channelId)
            let message = await channel.messages.fetch(original_message_id)

            if (message.author.id != interaction.user.id) {
                return interaction.reply({ content: "You can't use this interaction!", ephemeral: true })
            }

            interaction.message.edit({ components: [] })

            //execute command summoner
            interaction.client.commands.get('profile').subcommandsExec.get("add").execute(message, [`${name}@${server}`], interaction.message)

            //reply with client only message
            interaction.reply({
                content: `Executing command ${this.name} for player ${name} on server ${server}`,
                ephemeral: true,
            })
        })
    },
    /**
     *
     * @param {Message} message
     * @param {Array} args
     */
    execute: async function (message, args, editMessage = null) {
        //set constant config to config from global scope
        const config = message.client.config
        //set constant global function to functions from global scope
        const gf = message.client.fc
        //get db
        const db = message.client.db


        if (args.length < 1) {
            let message = 'Please provide atleast summoner name'
            if (editMessage) {
                return editMessage.edit(message)
            } else {
                return message.reply('Please provide atleast your lol username.')
            }
        }

        let find = new FindUser(args, "PROFILE_ADD", editMessage)

        await find.getSummonerData(message, !editMessage ? false : true)

        let msg = find.editMessage
        let name = find.name
        let region = find.region

        let discordId = message.author.id
        let data

        if (await db.has(discordId)) {
            data = await db.get(discordId)

            let find = data.find((reg) => reg == `${name}@${region}`)
            if (find) {
                return msg.edit(`You already connected \`${name}\` on \`${region}\` with your account.`)
            }
        } else {
            data = []
        }

        await db.set(discordId, [...data, `${name}@${region}`])

        return msg.edit(`Connected \`${name}\` on region \`${region}\` to your discord account.`)
    },
}
