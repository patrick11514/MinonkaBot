const { MessageActionRow, MessageButton, Message, Client } = require('discord.js')

module.exports = {
    name: 'restart',
    arguments: [],
    subcommands: ['api', 'bot'],
    description: 'Restart the services',
    admin: true,
    /**
     *
     * @param {Client} client
     */
    setup: async function (client, reload = false) {
        if (reload) return

        client.on('interactionCreate', async (interaction) => {
            if (!interaction.isButton()) return
            let id = interaction.customId
            let split = id.split('@')
            let fromCommand = split[0]
            if (fromCommand != 'RESTART') return

            let subcommand = split[1]
            let channelId = split[2]
            let original_message_id = split[3]

            let channel = await interaction.client.channels.fetch(channelId)
            let message = await channel.messages.fetch(original_message_id)

            if (message.author.id != interaction.user.id) {
                return interaction.reply({ content: "You can't use this interaction!", ephemeral: true })
            }

            let components = interaction.message.components

            components.forEach((row) => {
                row.components.forEach((button) => {
                    button.disabled = true
                })
            })

            interaction.message.edit({ components: components })

            //execute command summoner
            interaction.client.commands.get('restart').subcommandsExec.get(subcommand).execute(message)

            //reply with client only message
            interaction.reply({
                content: `Executing command ${this.name} for service ${subcommand}`,
                ephemeral: true,
            })
        })
    },
    /**
     *
     * @param {Message} message
     * @param {Array} args
     */
    execute: async function (message, args) {
        let row = new MessageActionRow()

        row.addComponents(
            new MessageButton()
                .setLabel('API')
                .setCustomId('RESTART@api@' + message.channel.id + '@' + message.id)
                .setStyle('PRIMARY')
        )
        row.addComponents(
            new MessageButton()
                .setLabel('Bot')
                .setCustomId('RESTART@bot@' + message.channel.id + '@' + message.id)
                .setStyle('PRIMARY')
        )

        await message.reply({ content: 'Select service to restart', components: [row] })
    },
}
