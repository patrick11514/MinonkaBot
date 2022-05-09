const { Message } = require('discord.js')
const fs = require('fs')

module.exports = {
    name: 'generateemojis',
    subcommands: ["show", "showraw"],
    description: 'Generate emojis list',
    arguments: [],
    admin: true,
    /**
     * Required function
     * @param {Message} message
     */
    execute: async function (message) {
        let servers = [
            '955054979192881162', //Champs1
            '955053883103780894', //Champs2
            '955054220766248970', //Champs3
            '955054457098498078', //Champs4
            '967816629557817354', //Mix1
            '969587984682877048', //Mix2
            '973334813467611146', //Items1
            '973338458003222568', //Items2
            '973338484779647077', //Items3
            '973338509458964590', //Items4
            '973338537007128576', //Items5
        ]
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
