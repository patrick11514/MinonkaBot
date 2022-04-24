const { MessageActionRow, MessageButton, Client, Message } = require('discord.js')
const fs = require('fs')
const path = require('path')
const Loop = require('../functions/loop.js')
const SendComponent = require('../functions/sendComponents.js')

module.exports = {
    name: 'summoner',
    subcommands: [],
    description: 'Get info about summoner',
    arguments: ['name'],
    /**
     *
     * @param {Client} client
     * @param {boolean} reload
     */
    setup: function (client, reload = false) {
        if (reload) return

        client.on('interactionCreate', async (interaction) => {
            if (!interaction.isButton()) return
            let id = interaction.customId
            let split = id.split('@')
            let fromCommand = split[0]
            if (fromCommand != 'SUMMONER') return

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
            interaction.client.commands.get('summoner').execute(message, [`${name}@${server}`], interaction.message)

            //reply with client only message
            interaction.reply({
                content: `Executing command ${this.name} for player ${name} on server ${server}`,
                ephemeral: true,
            })
        })
    },
    /**
     *
     * @param {Message} message
     * @param {Array} args
     * @param {Message} editMessage 
     */
    execute: async function (message, args, editMessage = null) {
        //set constant config to config from global scope
        const config = message.client.config
        //set constant global function to functions from global scope
        const gf = message.client.fc
        //db
        const db = message.client.db

        let discordId = message.author.id

        //if no arguments, then reply with error message
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
                let component = new SendComponent("SUMMONER", "PRIMARY", message, function ())
                let rows = []

                for (let i = 0, j = accounts.length; i < j; i += 5) {
                    let temp = accounts.slice(i, i + 5)
                    let row = new MessageActionRow()
                    temp.forEach((account) => {
                        let [name, region] = account.split("@")
                        row.addComponents(
                            new MessageButton()
                                .setCustomId(
                                    `SUMMONER@${name}@${region.toLowerCase()}@${message.channelId}@${message.id}`
                                )
                                .setLabel(`${name} - ${Object.keys(config.regions_readable).find(key => config.regions_readable[key] == region)}`)
                                .setStyle('PRIMARY')
                        )
                    })
                    rows.push(row)
                }

                return message.reply({
                    content: "Please select one account:",
                    components: rows,
                })
            }

            args[0] = accounts[0]
        }
        //put arguments together with space between them (if somebody have nickname with space)
        let name = args.join(' ')
        let region
        let summoner = null
        let msg

        if (name.includes('@')) {
            //split name and region
            let split = name.split('@')
            //and set name to first part
            name = split[0]
            //and set region to second part
            region = split[1].toUpperCase()
            //try to convert region
            if (config.regions_readable[region]) {
                region = config.regions_readable[region]
            }
            //if region is invalid then reply with error message
            if (!config.regions.includes(region)) {
                let regions = config.regions.join(', ')
                let msg = `Invalid region \`${region}\`.\nValid regions ${regions}`
                if (editMessage) {
                    return editMessage.edit(msg)
                }
                return message.reply(msg)
            }
        } else {
            //try to search player on some region
            if (editMessage) {
                msg = await editMessage.edit('Searching player')
            } else {
                msg = await message.reply('Searching player')
            }

            let loop = new Loop(message, msg)

            let find = await gf.findSummoner(name, message.client, loop.id)

            loop.stop()

            //if player not found then reply with error message
            if (!find) {
                return msg.edit("Can't find player on any server")
            }

            let regions = find.regions
            let info = find.info

            //if player found on more than 1 server then reply with message with list of servers
            if (regions.length > 1) {
                let rows = []
                let player_info = '\n**Region: level**\n'

                for (let [id, data] of Object.entries(info)) {
                    player_info += `${id}: \`${data.summonerLevel}\` `
                }

                for (let i = 0, j = regions.length; i < j; i += 5) {
                    let temp = regions.slice(i, i + 5)
                    let row = new MessageActionRow()
                    temp.forEach((region) => {
                        row.addComponents(
                            new MessageButton()
                                .setCustomId(
                                    `SUMMONER@${name}@${region.toLowerCase()}@${message.channelId}@${message.id}`
                                )
                                .setLabel(region)
                                .setStyle('PRIMARY')
                        )
                    })
                    rows.push(row)
                }

                return msg.edit({
                    content: `Found ${name} on multiple servers, please select one.\n${player_info}`,
                    components: rows,
                })
            }

            region = regions[0]
            summoner = info[0]
        }
        if (!msg) {
            if (editMessage) {
                msg = await editMessage.edit('Loading...')
            } else {
                msg = await message.reply('Loading...')
            }
        }

        if (summoner == null) {
            summoner = await gf.getSummoner(name, region)
        }

        if (!summoner) {
            return msg.edit(`Summoner \`${name}\` on region \`${region}\` not found`)
        }

        let info = {
            name: summoner.name,
            region: Object.keys(config.regions_readable).find((key) => region === config.regions_readable[key]),
            level: summoner.summonerLevel,
            icon: summoner.profileIconId,
        }

        let ranked_data = await gf.getSummonerRanks(summoner.id, region)

        info.solo = ranked_data.solo
        info.flex = ranked_data.flex

        let getImage
        try {
            getImage = await gf.getImage('summoner', info)
        } catch (e) {
            return msg.edit(`Can't get image for summoner \`${name}\` on region \`${region}\` (API Error)`)
        }
        let image = path.join('./image_server', getImage)

        if (!fs.existsSync(image)) {
            return msg.edit(`Can't get image for summoner \`${name}\` on region \`${region}\` (File not found)`)
        }

        msg.edit({ content: ' ', files: [image] })
    },
}
