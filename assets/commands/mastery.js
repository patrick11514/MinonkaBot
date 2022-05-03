const { Client, Message, MessageActionRow, MessageSelectMenu, MessageButton } = require('discord.js')
const FindUser = require('../functions/findUser')
const fs = require('fs')
const SendComponent = require('../functions/sendComponents')
const Profile = require('../functions/profile')

module.exports = {
    name: 'mastery',
    subcommands: ['champion'],
    description: 'Show masteries of champions',
    arguments: ['name', 'region'],
    /**
     * Optional function
     * @param {Client} client
     */
    setup: function (client, reload = false) {
        if (reload) return

        client.on('interactionCreate', async (interaction) => {
            if (!interaction.isButton()) return
            let id = interaction.customId
            let split = id.split('@')
            let fromCommand = split[0]
            if (fromCommand != 'MASTERY') return

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
            interaction.client.commands.get('mastery').execute(message, [`${name}@${server}`], interaction.message)

            //reply with client only message
            interaction.reply({
                content: `Executing command ${this.name} for player ${name} on server ${server}`,
                ephemeral: true,
            })
        })

        client.on('interactionCreate', async (interaction) => {
            if (!interaction.isSelectMenu()) return
            let id = interaction.customId
            let split = id.split('@')
            let fromCommand = split[0]
            if (fromCommand != 'MASTERY') return
            let summonerId = split[1]
            let region = split[2]
            let author = split[3]
            let message = interaction.message
            let gf = message.client.fc
            let selected = interaction.values[0]
            const emotes = JSON.parse(fs.readFileSync("./assets/emojis.json"))

            if (!author) {
                return interaction.reply({ content: "Please send command again", ephemeral: true })
            }

            if (author != interaction.user.id) {
                return interaction.reply({ content: "You can't use this interaction!", ephemeral: true })
            }

            let masteries = await gf.getMasteries(summonerId, region)

            let mastery = gf.visualizeMastery(masteries[selected], emotes, message.client)

            interaction.update({
                content: mastery
            })
        })

        client.on('interactionCreate', async (interaction) => {
            if (!interaction.isButton()) return
            let id = interaction.customId
            let split = id.split('@')
            let fromCommand = split[0]
            if (fromCommand != 'MASTERY_NEXT' && fromCommand != "MASTERY_PREV" && fromCommand != "MASTERY_MAIN") return
            let summonerId = split[1]
            let region = split[2]
            let page = parseInt(split[3])
            let author = split[4]
            let message = interaction.message
            let gf = message.client.fc

            if (!author) {
                return interaction.reply({ content: "Please send command again", ephemeral: true })
            }

            if (author != interaction.user.id) {
                return interaction.reply({ content: "You can't use this interaction!", ephemeral: true })
            }

            let masteries = await gf.getMasteries(summonerId, region)

            let components = interaction.message.components

            if (fromCommand == "MASTERY_NEXT") {
                let options = []

                let firstId = (page * 25);
                let lastId = Math.min(masteries.length, (page + 1) * 25);
                let max = masteries.length
                if (lastId > max) {
                    lastId = max
                }

                for (let i = (page * 25); i < Math.min(masteries.length, (page + 1) * 25); i++) {
                    let mastery = masteries[i]
                    let champion = message.client.champions[mastery.championId]
                    let level = mastery.championLevel
                    let points = mastery.championPoints

                    options.push({
                        label: `${champion} - level ${level} (${points} points)`,
                        description: "Select to display mastery for " + champion,
                        value: `${i}`
                    })
                }
                page = page + 1

                if (page >= Math.ceil(masteries.length / 25)) {
                    components[1].components[1].disabled = true
                }
                components[1].components[0].disabled = false

                let label = components[1].components[0].customId
                label = label.split("@")
                label[3] = page
                components[1].components[0].customId = label.join("@")

                label = components[1].components[1].customId
                label = label.split("@")
                label[3] = page
                components[1].components[1].customId = label.join("@")

                components[0].components[0].options = options
                components[0].components[0].placeholder = `Nothing selected - page ${page} (${firstId} - ${lastId}/${max})`
            } else if (fromCommand == "MASTERY_PREV") {
                let options = []

                let firstId = ((page - 2) * 25);
                let lastId = Math.min(masteries.length, (page - 1) * 25);
                let max = masteries.length
                if (lastId > max) {
                    lastId = max
                }

                for (let i = ((page - 2) * 25); i < Math.min(masteries.length, (page - 1) * 25); i++) {
                    let mastery = masteries[i]
                    let champion = message.client.champions[mastery.championId]
                    let level = mastery.championLevel
                    let points = mastery.championPoints

                    options.push({
                        label: `${champion} - level ${level} (${points} points)`,
                        description: "Select to display mastery for " + champion,
                        value: `${i}`
                    })
                }

                page = page - 1

                if (page <= 1) {
                    components[1].components[0].disabled = true
                }
                components[1].components[1].disabled = false

                let label = components[1].components[0].customId
                label = label.split("@")
                label[3] = page
                components[1].components[0].customId = label.join("@")

                label = components[1].components[1].customId
                label = label.split("@")
                label[3] = page
                components[1].components[1].customId = label.join("@")

                components[0].components[0].options = options
                components[0].components[0].placeholder = `Nothing selected - page ${page} (${firstId} - ${lastId}/${max})`
            } else {
                const emotes = JSON.parse(fs.readFileSync("./assets/emojis.json"))

                let text = "**First 3 masteries**:\n"

                for (let i = 0; i < 3; i++) {
                    text += gf.visualizeMastery(masteries[i], emotes, message.client) + "\n\n"
                }

                let options = []

                for (let i = 0; i < Math.min(masteries.length, 25); i++) {
                    let mastery = masteries[i]
                    let champion = message.client.champions[mastery.championId]
                    let level = mastery.championLevel
                    let points = mastery.championPoints

                    options.push({
                        label: `${champion} - level ${level} (${points} points)`,
                        description: "Select to display mastery for " + champion,
                        value: `${i}`
                    })
                }

                page = 1

                components[1].components[0].disabled = true
                components[1].components[1].disabled = false

                let label = components[1].components[0].customId
                label = label.split("@")
                label[3] = page
                components[1].components[0].customId = label.join("@")

                label = components[1].components[1].customId
                label = label.split("@")
                label[3] = page
                components[1].components[1].customId = label.join("@")

                components[0].components[0].options = options
                components[0].components[0].placeholder = `Nothing selected - page ${page} (0 - 25/${masteries.length})`

                return interaction.update({
                    content: text,
                    components: components
                })

            }

            interaction.update({
                components: components
            })
        })
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

            let profile = new Profile(db, gf)
            let reply = !editMessage ? true : false

            let account = await profile.getAccount(discordId, "MASTERY", "Please provide a summoner name", reply ? message : editMessage, reply)

            if (!account) {
                return
            }

            args[0] = account
        }

        let find = new FindUser(args, "MASTERY", editMessage)

        await find.getSummonerData(message, !editMessage ? false : true)

        let summoner = find.getData()
        let region = find.region

        let masteries = await gf.getMasteries(summoner.id, region)

        let text = "**First 3 masteries**:\n"

        for (let i = 0; i < 3; i++) {
            text += gf.visualizeMastery(masteries[i], emotes, message.client) + "\n\n"
        }


        let options = []

        for (let i = 0; i < Math.min(masteries.length, 25); i++) {
            let mastery = masteries[i]
            let champion = message.client.champions[mastery.championId]
            let level = mastery.championLevel
            let points = mastery.championPoints

            options.push({
                label: `${champion} - level ${level} (${points} points)`,
                description: "Select to display mastery for " + champion,
                value: `${i}`
            })
        }

        let row = new MessageActionRow().addComponents(new MessageSelectMenu()
            .setCustomId("MASTERY@" + summoner.id + "@" + region + "@" + message.author.id)
            .setPlaceholder(`Nothing selected - page 1 (0-25/${masteries.length})`)
            .addOptions(options)
        )

        let row2 = new MessageActionRow()
        if (masteries.length > 25) {
            row2.addComponents(
                new MessageButton()
                    .setCustomId("MASTERY_PREV@" + summoner.id + "@" + region + "@" + 1 + "@" + message.author.id)
                    .setLabel("⬅️")
                    .setStyle("PRIMARY")
                    .setDisabled(true)
            )
                .addComponents(
                    new MessageButton()
                        .setCustomId("MASTERY_NEXT@" + summoner.id + "@" + region + "@" + 1 + "@" + message.author.id)
                        .setLabel("➡️")
                        .setStyle("PRIMARY")
                )
                .addComponents(
                    new MessageButton()
                        .setCustomId("MASTERY_MAIN@" + summoner.id + "@" + region + "@" + 1 + "@" + message.author.id)
                        .setLabel("First 3 champs")
                        .setStyle("SUCCESS")
                )
        }

        if (editMessage) {
            editMessage.edit({ content: text, components: [row, row2] })
        } else {
            message.reply({ content: text, components: [row, row2] })
        }

    },
}
