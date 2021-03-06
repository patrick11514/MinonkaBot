const JSONdb = require("simple-json-db");
const { Message } = require('discord.js');
const SendComponent = require("./sendComponents");

class Profile {

    /**
     * 
     * @param {JSONdb} db 
     * @param {Object} gf
     */
    constructor(db, gf) {
        this.db = db
        this.gf = gf
    }

    /**
     * 
     * @param {String} discordId 
     * @returns {Boolean} 
     */
    async checkIfSaved(discordId) {
        return (await this.db.has(discordId) && await this.db.get(discordId).length != 0)
    }

    /**
     * 
     * @param {String} discordId 
     * @returns {Array<Object>}
     */
    async getAccounts(discordId) {
        let accounts = await this.db.get(discordId)

        let [newAccounts, change] = await this.lookupForNewNames(accounts)

        if (change) {
            await this.db.set(discordId, newAccounts)
        }

        return newAccounts
    }

    /**
     * 
     * @param {Array<Object>} accounts 
     * @returns {Array<Object>}
     */
    async lookupForNewNames(accounts) {
        let newAccounts = []
        let change = false

        for (let i = 0; i < accounts.length; i++) {
            let account = accounts[i]
            let id = account.id
            let [name, region] = account.name.split("@")
            let newName = await this.lookupName(id, region)
            if (newName == false) {
                change = true
                continue
            }

            if (name != newName) {
                change = true
                newAccounts.push({
                    id: id,
                    name: `${newName}@${region}`
                })
            } else {
                newAccounts.push(account)
            }

        }

        return [newAccounts, change]
    }

    /**
     * 
     * @param {String} id 
     * @param {String} region 
     * @returns {String}
     */
    async lookupName(id, region) {
        let data = await this.gf.fetchApi("summoner/v4/summoners", region, id)

        if (data.status || !data.name) {
            return false
        }

        return data.name
    }

    /**
     * 
     * @param {String} discordId 
     * @param {String} command 
     * @param {String} text 
     * @param {Message} message 
     * @param {Boolean} reply 
     * @returns {String}
     */
    async getAccount(discordId, command, text, message, reply = false) {
        if (!await this.checkIfSaved(discordId)) {
            if (reply) {
                return message.reply(text)
            } else {
                return message.edit(text)
            }
        }

        let accounts = await this.getAccounts(discordId)

        if (accounts.length > 1) {
            let component = new SendComponent(command, "PRIMARY", message, function (name, region, config) {
                return `${name} - ${Object.keys(config.regions_readable).find(key => config.regions_readable[key] == region)}`
            })

            let rows = component.generate(accounts.map(account => account.name))

            let object = {
                content: "Please select one account:",
                components: rows
            }

            if (reply) {
                await message.reply(object)
            } else {
                await message.edit(object)
            }

            return false
        }

        return accounts[0].name
    }

    /**
     * 
     * @param {String} discordId 
     * @param {String} name 
     * @param {String} region 
     * @returns {Boolean}
     */
    async addAccount(discordId, name, region) {
        let data
        let id = await this.getId(name, region)

        if (await this.db.has(discordId)) {
            data = await this.db.get(discordId)

            let names = data.map(account => account.name)
            let find = names.find((n) => n == `${name}@${region}`)
            if (find) {
                return false
            }
        } else {
            data = []
        }

        await this.db.set(discordId, [
            ...data, {
                id: id,
                name: `${name}@${region}`
            }
        ])

        return true
    }

    /**
     * 
     * @param {String} name 
     * @param {String} region 
     * @returns {String}
     */
    async getId(name, region) {
        let data = await this.gf.fetchApi("summoner/v4/summoners/by-name", region, name)
        return data.id
    }

    /**
     * 
     * @param {String} discordId 
     * @param {String} name 
     * @param {String} region 
     * @returns {Boolean}
     */
    async removeAccount(discordId, name, region) {
        let accounts = await this.getAccounts(discordId)
        region = region.toUpperCase()

        let id = accounts.find(account => account.name == `${name}@${region}`).id

        let newAccounts = accounts.filter(account => account.id != id)

        await this.db.set(discordId, newAccounts)

        return true
    }
}


module.exports = Profile;