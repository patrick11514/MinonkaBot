const { Client, Message } = require('discord.js')
const fs = require('fs')
const FindUser = require('../functions/findUser.js')
const Profile = require('../functions/profile.js')
const fetch = require('node-fetch')

module.exports = {
    name: 'summoner',
    subcommands: [],
    description: 'Get info about summoner',
    arguments: ['name', "server"],
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
        const db2 = message.client.db2

        let discordId = message.author.id

        //if no arguments, then reply with error message
        if (args.length < 1) {

            let profile = new Profile(db, db2, gf)
            let reply = !editMessage ? true : false

            let account = await profile.getAccount(discordId, "SUMMONER", "Please provide a summoner name", reply ? message : editMessage, reply)

            if (!account) {
                return
            }

            args[0] = account
        }
        //put arguments together with space between them (if somebody have nickname with space)

        let find = new FindUser(args, "SUMMONER", editMessage)

        await find.getSummonerData(message, !editMessage ? false : true)

        let summoner = find.getData()
        let region = find.region
        let msg = find.editMessage

        if (!summoner) {
            return
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
            return msg.edit(`Can't get image for summoner \`${summoner.name}\` on region \`${region}\` (API Error)`)
        }

        let response = await fetch(`http://${process.env.API}/summonerFile/${getImage}`)

        if (response.status == 404) {
            let json = await response.json()
            return msg.edit(json.error)
        }

        let image = await response.buffer()

        msg.edit({
            content: ' ', files: [{
                attachment: image,
                name: `${summoner.name}.png`
            }]
        })
    },
}
