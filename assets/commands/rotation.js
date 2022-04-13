const { Message } = require('discord.js')
const fs = require('fs')

module.exports = {
    name: 'rotation',
    subcommands: [],
    description: 'Champion rotation',
    arguments: [],
    setup(client, reload = false) {
        client.cache.rotation = 0
    },
    /**
     * Required function
     * @param {Message} message
     * @param {Array} args
     */
    execute: async function (message) {
        //set constant global function to functions from global scope
        const gf = message.client.fc
        //set constant champions to champions list from global scope
        const champions = message.client.champions
        //read champion emojis
        const emojis = JSON.parse(await fs.readFileSync('./assets/emojis.json'))

        if (new Date().getTime() - message.client.cache.rotation > 4 * 60 * 60 * 1000) {
            msg = await message.reply('Scanning servers')
            let searchId = await gf.generateRandomString(12)
            message.client.searchingStatus[searchId] = {
                scanned: 0,
                total: 0,
            }
            let dots = 1
            let loaded = false
            let loop = async (msg) => {
                await new Promise((resolve) => setTimeout(resolve, 1000))
                if (loaded) return
                await msg.edit(
                    `Scanning servers${'.'.repeat(dots)} (${message.client.searchingStatus[searchId].scanned}/${
                        message.client.searchingStatus[searchId].total
                    })`
                )
                dots++
                if (dots > 3) dots = 1
                await loop(msg)
            }
            loop(msg)

            let rotation = await gf.getRotation(message.client, searchId)

            loaded = true
            await msg.edit('Generating message...')

            let text = ''
            for (let id in rotation.categories) {
                let category = rotation.categories[id]
                text += '**' + category.join(', ') + '**\n'

                let list = []
                rotation.champions[id].forEach((championId) => {
                    let championName = champions[championId]
                    list.push(`${emojis[championName]} ${championName}`)
                })
                text += list.join(', ') + '\n\n'
            }

            message.client.rotationCache = text
            message.client.cache.rotation = new Date().getTime()
            await msg.edit(text)
        } else {
            await message.reply(message.client.rotationCache)
        }
    },
}
