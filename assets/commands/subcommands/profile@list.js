const { Message } = require('discord.js')

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

        let discordId = message.author.id

        if (!await db.has(discordId) || await db.get(discordId).length == 0) {
            return message.reply("You don't have any linked accounts")
        }

        let accounts = await db.get(discordId)

        let text = `**Found ${accounts.length} linked accounts:**\n`
        accounts.forEach((accountString) => {
            let [name, region] = accountString.split("@")

            text += `${name} on region ${region}\n`
        })

        message.reply(text)
    },
}
