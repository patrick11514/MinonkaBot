const { Client, Message } = require('discord.js')
const FindUser = require('../functions/findUser')
const fs = require('fs')
const SendComponent = require('../functions/sendComponents')

module.exports = {
    name: 'mastery',
    subcommands: ['champion'],
    description: 'Show masteries of champions',
    arguments: ['name', 'region'],
    /**
     * Optional function
     * @param {Client} client
     */
    setup: function (client, reload = false) {
        if (reload) return

        client.on('interactionCreate', async (interaction) => {
            if (!interaction.isButton()) return
            let id = interaction.customId
            let split = id.split('@')
            let fromCommand = split[0]
            if (fromCommand != 'MASTERY') return

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
            interaction.client.commands.get('mastery').execute(message, [`${name}@${server}`], interaction.message)

            //reply with client only message
            interaction.reply({
                content: `Executing command ${this.name} for player ${name} on server ${server}`,
                ephemeral: true,
            })
        })
    },
    /**
     * Required function
     * @param {Message} message
     * @param {Array} args
     */
    execute: async function (message, args, editMessage = null) {
        const config = message.client.config
        const db = message.client.db
        const gf = message.client.fc
        const emotes = JSON.parse(fs.readFileSync("./assets/emojis.json"))

        let discordId = message.author.id

        if (args.length < 1) {
            if (!await db.has(discordId) || await db.get(discordId).length == 0) {

                let msg = 'Please provide a summoner name'
                if (editMessage) {
                    return editMessage.edit(msg)
                }
                return message.reply(msg)
            }

            let accounts = await db.get(discordId)

            if (accounts.length > 1) {
                let component = new SendComponent("MASTERY", "PRIMARY", message, function (name, region, config) {
                    return `${name} - ${Object.keys(config.regions_readable).find(key => config.regions_readable[key] == region)}`
                })

                let rows = await component.generate(accounts)

                return message.reply({
                    content: "Please select one account:",
                    components: rows,
                })
            }

            args[0] = accounts[0]
        }

        let find = new FindUser(args, "MASTERY", editMessage)

        await find.getSummonerData(message, !editMessage ? false : true)

        let summoner = find.getData()
        let region = find.region

        let masteries = await gf.getMasteries(summoner.id, region)

        let text = gf.visualizeMastery(masteries[0], emotes, message.client)

        console.log(text)

    },
}
