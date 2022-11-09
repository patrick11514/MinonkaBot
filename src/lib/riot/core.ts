import {
    EncryptedAccountId,
    EncryptedPuuid,
    EncryptedSummonerId,
    errorResponse,
    match,
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

        let data: SummonerBy | errorResponse = await this.r.makeRequest(url)

        if ((data as errorResponse)?.status) return null

        return data as SummonerBy
    }

    async getSummonerByAccountId(id: EncryptedAccountId, region: string): Promise<SummonerBy | null> {
        region = region.toUpperCase()

        let url = `https://${region}.api.riotgames.com/lol/summoner/v1/summoners/by-account/${id}`

        let data: SummonerBy | errorResponse = await this.r.makeRequest(url)

        if ((data as errorResponse)?.status) return null

        return data as SummonerBy
    }

    async getSummonerBySummonerId(id: EncryptedSummonerId, region: string): Promise<SummonerBy | null> {
        region = region.toUpperCase()

        let url = `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/${id}`

        let data: SummonerBy | errorResponse = await this.r.makeRequest(url)

        if ((data as errorResponse)?.status) return null

        return data as SummonerBy
    }

    async getChallenges(puuid: EncryptedPuuid, region: string): Promise<UserChallenges> {
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

    async getRankedData(id: EncryptedSummonerId, region: string): Promise<RankedData[] | null> {
        region = region.toUpperCase()

        let url = `https://${region}.api.riotgames.com/lol/league/v4/entries/by-summoner/${id}`

        let data: RankedData[] | errorResponse = await this.r.makeRequest(url)

        if ((data as errorResponse)?.status) return null

        return data as RankedData[]
    }

    async getMatches(id: EncryptedPuuid, route: string, count?: string | null): Promise<Array<string>> {
        let url = `https://${route}.api.riotgames.com/lol/match/v5/matches/by-puuid/${id}/ids?start=0&count=${
            count ? count : 10
        }`

        let data: Array<string> | errorResponse = await this.r.makeRequest(url)

        if ((data as errorResponse)?.status) return []

        return data as Array<string>
    }

    async getMatch(id: string, route: string): Promise<null | match> {
        let url = `https://${route}.api.riotgames.com/lol/match/v5/matches/${id}`

        let data: match | errorResponse = await this.r.makeRequest(url)

        if ((data as errorResponse)?.status) return null

        return data as match
    }
}

export default Riot
