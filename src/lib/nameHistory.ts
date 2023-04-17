import JSONdb from 'simple-json-db'
import Riot from './riot/core'
import Logger from './logger'
import User from '$types/usersDB'
import NameHistory from '$types/nameHistoryDB'

class linkedAccounts {
    discordId: string
    database: JSONdb
    database2: JSONdb
    l = new Logger('LinkedAccounts', 'cyanBright')

    constructor(discordId: string, database: JSONdb, database2: JSONdb) {
        this.discordId = discordId
        this.database = database
        this.database2 = database2
    }

    async addAccount(username: string, id: string, region: string) {
        let user: User

        if (this.database.has(this.discordId)) {
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
            id: id,
            region: region,
        })

        if (!this.database2.has(id)) {
            this.database2.set(id, {
                username: username,
                region: region,
                history: [username],
            })
        }

        this.database.set(this.discordId, user)
        return true
    }

    async historyAdd(username: string, region: string, id: string) {
        let accounts: NameHistory

        if (this.database2.has(id)) {
            accounts = this.database2.get(id)
        } else {
            accounts = {
                username: username,
                region: region,
                history: [username],
            }
            this.database2.set(id, accounts)
        }

        if (this.database.has(this.discordId)) {
            let user: User = this.database.get(this.discordId)
            let find = user.linkedAccounts.findIndex((account) => account.id == id)
            if (find != -1) {
                user.linkedAccounts[find].username = username
                this.database.set(this.discordId, user)
            }
        }

        if (accounts.history.includes(username)) return false

        accounts.history.push(username)
        accounts.username = username

        this.database2.set(id, accounts)
        return true
    }

    async checkHistory(
        accounts: {
            username: string
            id: string
            region: string
        }[]
    ) {
        let changed = false
        for (let account of accounts) {
            let data = await Riot.getSummonerBySummonerId(account.id, account.region)
            if (!data) continue
            if (data.name != account.username) {
                this.l.log('Found new account name ' + data.name + ' for account ' + account.username)
                changed = true
                await this.historyAdd(data.name, account.region, account.id)
            } else {
                if (!this.database2.has(account.id)) {
                    await this.historyAdd(data.name, account.region, account.id)
                }
            }
        }

        return changed
    }

    async getAccounts() {
        let user: User

        if (this.database.has(this.discordId)) {
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

        if (this.database.has(this.discordId)) {
            user = this.database.get(this.discordId)
        } else {
            user = {
                language: 'cs_CZ',
                linkedAccounts: [],
            }
        }

        user.linkedAccounts = user.linkedAccounts.filter((a) => a.id != id)

        this.database.set(this.discordId, user)
        return true
    }

    async getAccountHistory(id: string, username: string, region: string) {
        if (!this.database2.has(id)) {
            await this.historyAdd(username, region, id)

            return [username]
        }

        let accounts: NameHistory = this.database2.get(id)

        await this.checkHistory([
            {
                username: accounts.username,
                id: id,
                region: region,
            },
        ])

        //clone object, so pop function wont remove last item from virtual database object
        if (typeof structuredClone === 'undefined') {
            return JSON.parse(JSON.stringify(accounts.history))
        }

        return structuredClone(accounts.history)
    }
}

export default linkedAccounts
