const { Client } = require('discord.js')
const fetch = require('node-fetch')

Array.prototype.equals = function (array) {
    // if the other array is a falsy value, return
    if (!array) return false

    // compare lengths - can save a lot of time
    if (this.length != array.length) return false

    for (var i = 0, l = this.length; i < l; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!this[i].equals(array[i])) return false
        } else if (this[i] != array[i]) {
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false
        }
    }
    return true
}

module.exports = {
    config: null,

    /**
     *
     * @param {string} endpoint
     * @param {string} region
     * @param {string} param
     * @returns {Promise<object>}
     */
    fetchApi: async function (endpoint, region, param = '') {
        let url
        if (param != '') {
            url = `https://${region}.api.riotgames.com/lol/${endpoint}/${param}`
        } else {
            url = `https://${region}.api.riotgames.com/lol/${endpoint}`
        }

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
        client.searchingStatus[id].total = regions.length

        let servers = []
        let info = {}

        let i = 1
        for (let region of regions) {
            client.searchingStatus[id].scanned = i
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

        data.forEach((queue) => {
            let miniSeries = {}
            if (queue.miniSeries) {
                let games = queue.miniSeries.progress.split('')
                miniSeries.games = games
                miniSeries.images = []
                miniSeries.games.forEach((gameType, i) => {
                    miniSeries.images[i] = gameType
                        .replace('W', 'seriesWin.png')
                        .replace('L', 'seriesLose.png')
                        .replace('N', 'seriesEmpty.png')
                })
            }
            ranks[this.config.queues[queue.queueType]] = {
                tier: queue.tier,
                rank: queue.rank,
                wins: queue.wins,
                loses: queue.losses,
                total: queue.wins + queue.losses,
                wr: ((queue.wins / (queue.wins + queue.losses)) * 100).toFixed(1),
                lp: queue.leaguePoints,
                promos: miniSeries,
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

    /**
     * @param {Client} client
     * @param {string} id
     */
    getRotation: async function (client, id) {
        let regions = this.config.regions
        client.searchingStatus[id].total = regions.length

        let rotation = { categories: {}, champions: {} }
        let categoryId = 0

        let i = 1
        for (let region of regions) {
            client.searchingStatus[id].scanned = i
            let json = await this.fetchApi(this.config.endpoints['rotation'], region)
            let champions = json.freeChampionIds
            let found = false
            for (let [category, champCat] of Object.entries(rotation.champions)) {
                if (champions.equals(champCat)) {
                    found = true
                    rotation.categories[category] = [...rotation.categories[category], region]
                    break
                }
            }
            if (!found) {
                rotation.champions[categoryId] = champions
                rotation.categories[categoryId] = [region]
                categoryId++
            }
            i++
        }

        return rotation
    },

    getMasteries: async function (id, region) {
        let json = await this.fetchApi(this.config.endpoints['mastery/by-id'], region, id)

        return json
    },

    visualizeMastery: function (masteryData, emotes, client) {
        let champions = client.champions
        let championId = masteryData.championId
        let championName = champions[championId]

        let text = `${emotes[championName]} **${championName}**:\n`
        let d = new Date(masteryData.lastPlayTime)
        text += `⌛ Last played: ${d.getHours()}:${d.getMinutes()} ${d.getDate()}.${d.getMonth()}.${d.getFullYear()}\n`
        text += `${emotes["chestacquired"]} Chest acquired: ${masteryData.chestGranted ? 'Yes' : 'No'}\n`
        let maxPoints = masteryData.championPointsSinceLastLevel + masteryData.championPointsUntilNextLevel
        let points = championPointsSinceLastLevel


        console.log(masteryData)
    }
}
