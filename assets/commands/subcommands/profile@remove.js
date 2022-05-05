const { MessageActionRow, MessageButton, Client, Message } = require('discord.js')
const Profile = require('../../functions/profile')

module.exports = {
    mainCommand: 'profile',
    name: 'remove',
    arguments: [],
    description: 'Remove linked lol account from your discord account',
    /**
     * 
     * @param {Client} client
     * @param {boolean} reload
     */
    setup: function (client, reload = false) {
        if (reload) return

        client.on('interactionCreate', async (interaction) => {
            if (!interaction.isButton()) return
            let id = interaction.customId
            let split = id.split('@')
            let fromCommand = split[0]
            if (fromCommand != 'PROFILE_REMOVE') return

            let name = split[1]
            let server = split[2]
            let channelId = split[3]
            let original_message_id = split[4]

            let channel = await interaction.client.channels.fetch(channelId)
            let message = await channel.messages.fetch(original_message_id)

            if (message.author.id != interaction.user.id) {
                return interaction.reply({ content: "You can't use this interaction!", ephemeral: true })
            }

            let components = interaction.message.components

            components.forEach((component) => {
                component.components.forEach((button) => {
                    button.disabled = true
                })
            })


            interaction.message.edit({ components: components })

            //db
            const db = interaction.client.db
            const db2 = interaction.client.db2

            let discordId = message.author.id

            let profile = new Profile(db, db2, interaction.client.fc)
            profile.removeAccount(discordId, name, server)

            //reply with client only message
            interaction.reply({
                content: `Successfully unlinked account ${name} from your discord account.`,
                ephemeral: true,
            })
        })
    },
    /**
     *
     * @param {Message} message
     */
    execute: async function (message) {
        //db
        const db = message.client.db
        const db2 = message.client.db2

        //config
        const config = message.client.config

        let discordId = message.author.id

        let profile = new Profile(db, db2, message.client.fc)
        let accounts = await profile.getAccounts(discordId)

        accounts = accounts.map(account => account.name)

        if (accounts.length == 0) {
            return message.reply("You don't have any linked accounts")
        }

        let text = `**Found ${accounts.length} linked accounts:**\n`
        accounts.forEach((accountString) => {
            let [name, region] = accountString.split("@")

            text += `${name} on region ${region}\n`
        })
        text += "\n**To remove account, click on corresponding button:**"

        let rows = []

        for (let i = 0, j = accounts.length; i < j; i += 5) {
            let temp = accounts.slice(i, i + 5)
            let row = new MessageActionRow()
            temp.forEach((account) => {
                let [name, region] = account.split("@")
                row.addComponents(
                    new MessageButton()
                        .setCustomId(
                            `PROFILE_REMOVE@${name}@${region.toLowerCase()}@${message.channelId}@${message.id}`
                        )
                        .setLabel(`${name} - ${Object.keys(config.regions_readable).find(key => config.regions_readable[key] == region)}`)
                        .setStyle('DANGER')
                )
            })
            rows.push(row)
        }

        message.reply({ content: text, components: rows })
    },
}
