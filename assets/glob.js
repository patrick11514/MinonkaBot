const { Client } = require('discord.js')
const fetch = require('node-fetch')

module.exports = {
    config: null,

    /**
     *
     * @param {string} endpoint
     * @param {string} region
     * @param {string} param
     * @returns {Promise<object>}
     */
    fetchApi: async function (endpoint, region, param) {
        let url = `https://${region}.api.riotgames.com/lol/${endpoint}/${param}`

        let response = await fetch(url, {
            headers: {
                'X-Riot-Token': process.env.RGtoken,
            },
        })

        let json = await response.json()

        return json
    },

    /**
     *
     * @param {string} name
     * @param {string} region
     * @returns {Promise<object>}
     */
    getSummoner: async function (name, region) {
        let json = await this.fetchApi(this.config.endpoints['summoner/by-name'], region, name)

        if (json.status && json.status.status_code == 404) {
            return false
        }

        return json
    },

    /**
     *
     * @param {string} name
     * @param {Client} client
     * @param {string} id
     * @returns
     */
    findSummoner: async function (name, client, id) {
        let regions = this.config.regions
        client.searchingPlayerStatus[id].total = regions.length

        let servers = []
        let info = {}

        let i = 1
        for (let region of regions) {
            client.searchingPlayerStatus[id].scanned = i
            let summoner = await this.getSummoner(name, region)
            if (summoner) {
                servers.push(region)
                info[region] = summoner
            }
            i++
        }
        if (servers.length > 0) {
            return {
                regions: servers,
                info: info,
            }
        }
        return false
    },

    /**
     *
     * @param {string} encryptedSummonerId
     * @param {string} region
     * @returns
     */
    getSummonerRanks: async function (encryptedSummonerId, region) {
        let data = await this.fetchApi(this.config.endpoints['league/by-id'], region, encryptedSummonerId)

        let ranks = {}

        console.log(data)

        data.forEach((queue) => {
            ranks[this.config.queues[queue.queueType]] = {
                tier: queue.tier,
                rank: queue.rank,
                wins: queue.wins,
                loses: queue.losses,
                total: queue.wins + queue.losses,
                wr: ((queue.wins / (queue.wins + queue.losses)) * 100).toFixed(1),
                lp: queue.leaguePoints,
            }
        })

        return ranks
    },

    /**
     *
     * @param {string} type
     * @param {Object} data
     * @returns
     */
    getImage: async function (type, data) {
        let types = {
            summoner: 'summonerProfile',
        }

        let response = await fetch(`http://${process.env.API}/${types[type]}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })
        let json = await response.json()
        if (json.file) {
            return json.file
        }
        if (json?.loading) {
            do {
                let data = await this.getImage(type, data)
                if (data.file) {
                    return data.file
                }
            } while (true)
        }
    },
    /**
     *
     * @param {Number} length
     * @returns
     */
    generateRandomString: function (length) {
        let result = ''
        let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        let charactersLength = characters.length
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength))
        }
        return result
    },
}
