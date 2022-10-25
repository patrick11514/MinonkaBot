import {
    EncryptedAccountId,
    EncryptedPuuid,
    EncryptedSummonerId,
    RankedData,
    SummonerBy,
    UserChallenges,
} from '../../types/riotApi'
import Logger from '../logger'
import Requests from './requests'

class Riot {
    r: Requests
    l: Logger

    constructor() {
        this.r = new Requests()
        this.l = new Logger('Riot', 'green')
    }

    async getSummonerByName(name: string, region: string): Promise<SummonerBy | null> {
        region = region.toUpperCase()

        let url = `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${name}`

        let data = await this.r.makeRequest(url)

        if (data?.status) return null

        return data
    }

    async getSummonerByAccountId(id: EncryptedAccountId, region: string): Promise<SummonerBy | null> {
        region = region.toUpperCase()

        let url = `https://${region}.api.riotgames.com/lol/summoner/v1/summoners/by-account/${id}`

        let data = await this.r.makeRequest(url)

        if (data?.status) return null

        return data
    }

    async getSummonerBySummonerId(id: EncryptedSummonerId, region: string): Promise<SummonerBy | null> {
        region = region.toUpperCase()

        let url = `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/${id}`

        let data = await this.r.makeRequest(url)

        if (data?.status) return null

        return data
    }

    async getChallenges(puuid: EncryptedPuuid, region: string): Promise<null | UserChallenges> {
        region = region.toUpperCase()

        let url = `https://${region}.api.riotgames.com/lol/challenges/v1/player-data/${puuid}`

        let data = await this.r.makeRequest(url)

        return data
    }

    async findAccount(username: string): Promise<
        Array<{
            name: string
            region: string
        }>
    > {
        let regions = process.client.config.regions

        let foundAccounts: Array<{
            name: string
            region: string
        }> = []

        this.l.start('Searching for accounts by name: ' + username)
        for (let i = 0; i < regions.length; i++) {
            this.l.log('Searching ' + regions[i] + '...')
            let data = await this.getSummonerByName(username, regions[i])
            if (!data) {
                this.l.log('Account not found')
                continue
            }
            this.l.log('Account found!')
            foundAccounts.push({
                name: data.name,
                region: regions[i],
            })
        }

        return foundAccounts
    }

    async getRankedData(id: EncryptedSummonerId, region: string): Promise<null | RankedData> {
        region = region.toUpperCase()

        let url = `https://${region}.api.riotgames.com/lol/league/v4/entries/by-summoner/${id}`

        let data = await this.r.makeRequest(url)

        return data
    }
}

export default Riot
