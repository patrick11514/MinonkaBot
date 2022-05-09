const { Message } = require('discord.js')
const fs = require('fs')

module.exports = {
    mainCommand: 'generatemojis',
    name: 'show',
    arguments: [],
    description: 'Show all loaded emojis',
    /**
     *
     * @param {Message} message
     */
    execute: async function (message) {
        let emojis = JSON.parse(await fs.readFileSync('./assets/emojis.json'))

        let texts = []
        let text = ""
        for (let emoji in emojis) {
            if (text.length + emoji.length + 3 + emojis[emoji].length > 2000) {
                texts.push(text)
                text = ""
            }
            text += `${emoji}: ${emojis[emoji]} `
        }
        if (text.length) {
            texts.push(text)
        }

        let reply = false

        for (let text of texts) {
            if (!reply) {
                await message.reply(text)
                reply = true
            } else {
                await message.channel.send(text)
            }
        }
    },
}
