const fetch = require('node-fetch')

module.exports = {
    config: null,

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

    getSummoner: async function (name, region) {
        let json = await this.fetchApi(this.config.endpoints['summoner/by-name'], region, name)

        if (json.status && json.status.status_code == 404) {
            return false
        }

        return json
    },

    findSummoner: async function (name) {
        let regions = this.config.regions

        let servers = []
        let info = {}

        for (let region of regions) {
            let summoner = await this.getSummoner(name, region)
            if (summoner) {
                servers.push(region)
                info[region] = summoner
            }
        }
        if (servers.length > 0) {
            return {
                regions: servers,
                info: info,
            }
        }
        return false
    },

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
}
