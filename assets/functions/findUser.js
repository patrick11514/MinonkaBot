const { Message } = require('discord.js')
const fetch = require('node-fetch')
const Loop = require('./loop')
const SendComponent = require('./sendComponents')


class FindUser {
    /**
     * 
     * @param {Array} args 
     * @param {Message|null} editMessage
     */
    constructor(args, commandName, editMessage = null) {
        this.args = args
        this.commandName = commandName
        this.editMessage = editMessage
    }

    getValues() {
        let name, region
        if (this.args.length > 1) {
            let arg = this.args.join(" ")
            if (arg.includes("@")) {
                let split = arg.split("@")
                name = split[0]
                region = split[1].toUpperCase()
            } else {
                name = this.args[0]
                region = this.args[1].toUpperCase()
            }
        } else {
            let arg = this.args[0]
            if (arg.includes("@")) {
                let split = arg.split("@")
                name = split[0]
                region = split[1].toUpperCase()
            } else {
                name = this.args[0]
            }
        }

        this.name = name
        this.region = region
    }

    /**
     * 
     * @param {Message} message 
     * @param {boolean} edit 
     */
    async checkIfUserExists(message, edit) {
        if (!this.name) throw new "No name provided"

        let summoner
        if (!this.region) {
            if (edit) {
                await this.editMessage.edit("Searching player")
            } else {
                this.editMessage = await message.reply("Searching player")
            }

            let loop = new Loop(message, this.editMessage)

            let data = await this.gf.findSummoner(this.name, message.client, loop.id)
            loop.stop()

            if (!data) {
                return this.editMessage.edit("Can't find player on any server.")
            }

            let regions = data.regions
            let info = data.info

            this.regions = regions
            this.info = info

            if (regions.length > 1) {
                let player_info = '\n**Region: level**\n'

                for (let [id, data] of Object.entries(info)) {
                    player_info += `${id}: \`${data.summonerLevel}\` `
                }

                let components = new SendComponent(this.commandName, "PRIMARY", message, function (name, region, config) {
                    return `${region}`
                })

                let rows = components.generate(regions)

                return this.editMessage.edit({
                    content: `Found ${this.name} on multiple servers, please select one.\n${player_info}`,
                    components: rows
                })

            }

            this.region = regions[0]
            summoner = info[0]
        } else {
            if (this.config.regions_readable[this.region]) {
                this.region = this.config.regions_readable[this.region]
            }

            if (!this.config.regions.includes(this.region)) {
                let regions = this.config.regions.join(', ')
                let msg = `Invalid region \`${this.region}\`.\nValid regions ${regions}`
                if (edit) {
                    return this.editMessage.edit(msg)
                }
                return message.reply(msg)
            }

        }

        if (!this.editMessage) {
            this.editMessage = await message.reply("Loading...")
        }

        if (summoner == null) {
            summoner = await this.gf.getSummoner(this.name, this.region)
        }

        if (!summoner) {
            return this.editMessage.edit(`Summoner \`${this.name}\` on region \`${this.region}\` not found`)
        }

        this.summoner = summoner
    }

    /**
     * 
     * @param {Message} message 
     * @param {boolean} edit 
     * @returns {self}
     */
    async getSummonerData(message, edit = false) {
        this.gf = message.client.fc
        this.config = message.client.config

        this.getValues()
        await this.checkIfUserExists(message, edit)
    }

    /**
     * 
     * @returns {Object}
     */
    getData() {
        return this.summoner
    }
}

module.exports = FindUser