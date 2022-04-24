const { MessageActionRow, MessageButton, Message, Client } = require('discord.js')
const Loop = require('../../functions/loop.js')

module.exports = {
    mainCommand: 'profile',
    name: 'add',
    arguments: ['name', 'server'],
    description: 'Add lol profile to your discord account',
    /**
     * 
     * @param {Client} client
     */
    setup: function (client, reload = false) {
        if (reload) return

        client.on('interactionCreate', async (interaction) => {
            if (!interaction.isButton()) return
            let id = interaction.customId
            let split = id.split('@')
            let fromCommand = split[0]
            if (fromCommand != 'PROFILE_ADD') return

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
            interaction.client.commands.get('profile').subcommandsExec.get("add").execute(message, [`${name}@${server}`], interaction.message)

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
     */
    execute: async function (message, args, editMessage = null) {
        //set constant config to config from global scope
        const config = message.client.config
        //set constant global function to functions from global scope
        const gf = message.client.fc
        //get db
        const db = message.client.db


        if (args.length < 1) {
            let message = 'Please provide atleast summoner name'
            if (editMessage) {
                return editMessage.edit(message)
            } else {
                return message.reply('Please provide atleast your lol username.')
            }
        }

        let name, summoner, region, msg

        if (args.length > 1) {
            let arg = args.join(" ")
            if (arg.includes("@")) {
                let split = arg.split("@")
                name = split[0]
                region = split[1].toUpperCase()
            } else {
                name = args[0]
                region = args[1].toUpperCase()
            }
        } else {
            let arg = args[0]
            if (arg.includes("@")) {
                let split = arg.split("@")
                name = split[0]
                region = split[1].toUpperCase()
            } else {
                name = args[0]
            }
        }

        if (!region) {
            if (editMessage) {
                msg = await editMessage.edit('Searching player')
            } else {
                msg = await message.reply('Searching player')
            }

            let loop = new Loop(message, msg)

            let data = await gf.findSummoner(name, message.client, loop.id)
            loop.stop()

            if (!data) {
                return msg.edit("Can't find player on any server")
            }

            let regions = data.regions
            let info = data.info

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
                                    `PROFILE_ADD@${name}@${region.toLowerCase()}@${message.channelId}@${message.id}`
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
        } else {
            if (config.regions_readable[region]) {
                region = config.regions_readable[region]
            }

            if (!config.regions.includes(region)) {
                let regions = config.regions.join(', ')
                let msg = `Invalid region \`${region}\`.\nValid regions ${regions}`
                if (editMessage) {
                    return editMessage.edit(msg)
                }
                return message.reply(msg)
            }
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

        let discordId = message.author.id
        let data

        if (await db.has(discordId)) {
            data = await db.get(discordId)

            let find = data.find((reg) => reg == `${name}@${region}`)
            if (find) {
                return msg.edit(`You already connected \`${name}\` on \`${region}\` with your account.`)
            }
        } else {
            data = []
        }

        await db.set(discordId, [...data, `${name}@${region}`])

        return msg.edit(`Connected \`${name}\` on region \`${region}\` to your discord account.`)
    },
}
