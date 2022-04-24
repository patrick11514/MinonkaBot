const { Message } = require('discord.js')
const fs = require('fs')

module.exports = {
    name: 'generateemojis',
    subcommands: [],
    description: 'Generate emojis list',
    arguments: [],
    admin: true,
    /**
     * Required function
     * @param {Message} message
     */
    execute: async function (message) {
        let servers = ['955054979192881162', '955053883103780894', '955054220766248970', '955054457098498078']
        let count = 0
        let emojiList = {}

        for (let server of servers) {
            let guild = await message.client.guilds.fetch(server)
            let emojis = await guild.emojis.fetch()
            emojis.forEach((emoji) => {
                emojiList[emoji.name] = `<:${emoji.name}:${emoji.id}>`
                count++
            })
        }

        await fs.writeFileSync('./assets/emojis.json', JSON.stringify(emojiList, null, 4))
        await message.reply(`Fetched ${count} emojis.`)
    },
}
