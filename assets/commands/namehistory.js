const { Message, Client } = require('discord.js')
const FindUser = require('../functions/findUser')
const Profile = require('../functions/profile')

module.exports = {
    name: 'namehistory',
    subcommands: [],
    description: 'Get history of user\'s names',
    arguments: ["name", "server"],

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
            if (fromCommand != 'NAMEHISTORY') return

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
            interaction.client.commands.get('namehistory').execute(message, [`${name}@${server}`], interaction.message)

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
    execute: async function (message, args, editMessage = false) {
        const db = message.client.db
        const db2 = message.client.db2
        const gf = message.client.fc

        let discordId = message.author.id

        let profile = new Profile(db, db2, gf)

        if (args.length < 1) {

            let reply = !editMessage ? true : false

            let account = await profile.getAccount(discordId, "NAMEHISTORY", "Please profile a summoner name", reply ? message : editMessage, reply)

            if (account == false) return

            args[0] = account
        }

        let find = new FindUser(args, "NAMEHISTORY", editMessage)

        await find.getSummonerData(message, !editMessage ? false : true)

        let summoner = find.getData()
        let region = find.region
        let msg = find.editMessage

        let accounts = await profile.getNameHistory(summoner.id, region)

        let text = `**Name history of ${summoner.name}**:\n`

        accounts.forEach((name, id) => {
            text += `${name}`
            if (id == 0) {
                text += ` (current)`
            }
            text += "\n"
        })

        msg.edit(text)
    },
}
