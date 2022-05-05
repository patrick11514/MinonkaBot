const { Message } = require('discord.js')
const Profile = require('../../functions/profile')

module.exports = {
    mainCommand: 'profile',
    name: 'list',
    arguments: [],
    description: 'List all linked accounts on your discord account',
    /**
     *
     * @param {Message} message
     */
    execute: async function (message) {
        //db
        const db = message.client.db
        const db2 = message.client.db2

        let discordId = message.author.id

        let profile = new Profile(db, db2, message.client.fc)
        let accounts = await profile.getAccounts(discordId)

        if (accounts.length == 0) {
            return message.reply("You don't have any linked accounts! Use `?profile add` to add one!")
        }

        let text = `**Found ${accounts.length} linked accounts:**\n`
        accounts.map((account) => account.name).forEach((accountString) => {
            let [name, region] = accountString.split("@")

            text += `${name} on region ${region}\n`
        })

        message.reply(text)
    },
}
