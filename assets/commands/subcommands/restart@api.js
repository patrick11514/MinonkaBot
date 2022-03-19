const { Client, Message } = require('discord.js')
const fetch = require('node-fetch')

module.exports = {
    mainCommand: 'restart',
    name: 'api',
    arguments: [],
    description: 'Restart API',
    admin: true,
    /**
     *
     * @param {Message} message
     * @param {Array} args
     */
    execute: async function (message, args) {
        message = await message.reply('Restarting api...')
        let response = await fetch(`http://${process.env.API}/restart`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                token: process.env.restartToken,
            }),
        })
        let json = await response.json()
        if (json.error) {
            return message.edit(json.error)
        }

        message = await message.edit('Waiting for response...')

        let loaded = false
        let loop = async (message) => {
            await new Promise((resolve) => setTimeout(resolve, 200))
            if (loaded) return
            let json
            try {
                let response = await fetch(`http://${process.env.API}/status`)
                json = await response.json()
            } catch (e) {
                json = {}
            }
            if (json.status) {
                loaded = true
                await message.edit('API restarted!')
            }
            await loop(message)
        }
        loop(message)
    },
}
