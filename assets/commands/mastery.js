const { Client, Message } = require('discord.js')
const FindUser = require('../functions/findUser')
const fs = require('fs')

module.exports = {
    name: 'mastery',
    subcommands: ['champion'],
    description: 'Show masteries of champions',
    arguments: ['name', 'region'],
    /**
     * Optional function
     * @param {Client} client
     */
    setup: function (client) {
        //do something
    },
    /**
     * Required function
     * @param {Message} message
     * @param {Array} args
     */
    execute: async function (message, args, editMessage = null) {
        const config = message.client.config
        const db = message.client.db
        const gf = message.client.fc
        const emotes = JSON.parse(fs.readFileSync("./assets/emojis.json"))

        let discordId = message.author.id

        if (args.length < 1) {
            if (!await db.has(discordId) || await db.get(discordId).length == 0) {

                let msg = 'Please provide a summoner name'
                if (editMessage) {
                    return editMessage.edit(msg)
                }
                return message.reply(msg)
            }

            let accounts = await db.get(discordId)

            if (accounts.length > 1) {
                let component = new SendComponent("MASTERY", "PRIMARY", message, function (name, region, config) {
                    return `${name} - ${Object.keys(config.regions_readable).find(key => config.regions_readable[key] == region)}`
                })

                let rows = await component.generate(accounts)

                return message.reply({
                    content: "Please select one account:",
                    components: rows,
                })
            }

            args[0] = accounts[0]
        }

        let find = new FindUser(args, "MASTERY", editMessage)

        await find.getSummonerData(message, !editMessage ? false : true)

        let summoner = find.getData()
        let region = find.region

        let masteries = await gf.getMasteries(summoner.id, region)

        let text = gf.visualizeMastery(masteries[0], emotes, message.client)

        console.log(text)

    },
}
