import JSONdb from 'simple-json-db'
import User from '../types/usersDB'
import Riot from './riot/core'

class linkedAccounts {
    discordId: string
    database: JSONdb

    constructor(discordId: string, database: JSONdb) {
        this.discordId = discordId
        this.database = database
    }

    async addAccount(username: string, id: string, region: string) {
        let user: User

        if (await this.database.has(this.discordId)) {
            user = this.database.get(this.discordId)
        } else {
            user = {
                language: 'cs_CZ',
                linkedAccounts: [],
            }
        }

        //check if account is already linked
        let find = user.linkedAccounts.find((account) => account.id == id)
        if (find) return false

        user.linkedAccounts.push({
            username: username,
            nameHistory: [username],
            id: id,
            region: region,
        })

        await this.database.set(this.discordId, user)
        return true
    }

    async historyAdd(username: string, id: string) {
        let user: User

        if (await this.database.has(this.discordId)) {
            user = this.database.get(this.discordId)
        } else {
            user = {
                language: 'cs_CZ',
                linkedAccounts: [],
            }
        }

        let find = user.linkedAccounts.find((account) => account.id == id)
        if (!find) return false

        if (find.nameHistory.includes(username)) return false

        find.nameHistory.push(username)
        find.username = username

        await this.database.set(this.discordId, user)
        return true
    }

    async checkHistory(
        accounts: {
            username: string
            nameHistory: Array<string>
            id: string
            region: string
        }[]
    ) {
        let changed = false
        for (let account of accounts) {
            let riot = new Riot()
            let data = await riot.getSummonerBySummonerId(account.id, account.region)
            if (!data) continue
            if (data.name != account.username) {
                changed = true
                await this.historyAdd(data.name, account.id)
            }
        }

        return changed
    }

    async getAccounts() {
        let user: User

        if (await this.database.has(this.discordId)) {
            user = await this.database.get(this.discordId)
            //check history of linked accounts
            if (user.linkedAccounts) {
                if (user.linkedAccounts.length > 0) {
                    let check = await this.checkHistory(user.linkedAccounts)
                    if (check) {
                        user = await this.database.get(this.discordId)
                    }
                }
            } else {
                user.linkedAccounts = []
            }
        } else {
            user = {
                language: 'cs_CZ',
                linkedAccounts: [],
            }
        }

        return user.linkedAccounts
    }

    async removeAccount(id: string) {
        let user: User

        if (await this.database.has(this.discordId)) {
            user = this.database.get(this.discordId)
        } else {
            user = {
                language: 'cs_CZ',
                linkedAccounts: [],
            }
        }

        user.linkedAccounts = user.linkedAccounts.filter((a) => a.id != id)

        await this.database.set(this.discordId, user)
        return true
    }
}

export default linkedAccounts
