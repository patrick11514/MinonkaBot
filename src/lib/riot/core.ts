import {
    cherryMatch,
    EncryptedAccountId,
    EncryptedPuuid,
    EncryptedSummonerId,
    errorResponse,
    normalMatch,
    RankedData,
    Rotation,
    SummonerBy,
    TournamentData,
    UserChallenges
} from '$types/riotApi'
import Logger from '../logger'
import Requests from './requests'

class Riot {
    static l = new Logger('Riot', 'green')
    static r = new Requests(Riot.l)

    static async getSummonerByName(name: string, region: string): Promise<SummonerBy | null> {
        region = region.toUpperCase()

        let url = `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${name}`

        let data = await this.r.makeRequest<SummonerBy>(url)

        if ((data as errorResponse)?.status) return null

        return data as SummonerBy
    }

    static async getSummonerByAccountId(id: EncryptedAccountId, region: string): Promise<SummonerBy | null> {
        region = region.toUpperCase()

        let url = `https://${region}.api.riotgames.com/lol/summoner/v1/summoners/by-account/${id}`

        let data = await this.r.makeRequest<SummonerBy>(url)

        if ((data as errorResponse)?.status) return null

        return data as SummonerBy
    }

    static async getSummonerBySummonerId(id: EncryptedSummonerId, region: string): Promise<SummonerBy | null> {
        region = region.toUpperCase()

        let url = `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/${id}`

        let data = await this.r.makeRequest<SummonerBy>(url)

        if ((data as errorResponse)?.status) return null

        return data as SummonerBy
    }

    static async getChallenges(puuid: EncryptedPuuid, region: string): Promise<UserChallenges | null> {
        region = region.toUpperCase()

        let url = `https://${region}.api.riotgames.com/lol/challenges/v1/player-data/${puuid}`

        let data = await this.r.makeRequest<UserChallenges>(url)

        if ((data as errorResponse).status) return null

        return data as UserChallenges | null
    }

    static async findAccount(username: string): Promise<
        Array<{
            name: string
            region: string
            level: number
        }>
    > {
        let regions = process.client.config.regions

        let foundAccounts: Array<{
            name: string
            region: string
            level: number
        }> = []

        Riot.l.start('Searching for accounts by name: ' + username)
        let promises = []

        for (let i = 0; i < regions.length; i++) {
            promises.push(this.getSummonerByName(username, regions[i]))
        }

        let data = await Promise.all(promises)
        for (let id in data) {
            const account = data[id]
            if (!account) {
                Riot.l.log('Account not found for region: ' + regions[id])
                continue
            }

            Riot.l.log('Account found for region: ' + regions[id])
            foundAccounts.push({
                name: account.name,
                region: regions[id],
                level: account.summonerLevel,
            })
        }

        return foundAccounts
    }

    static async getRankedData(id: EncryptedSummonerId, region: string): Promise<RankedData[] | null> {
        region = region.toUpperCase()

        let url = `https://${region}.api.riotgames.com/lol/league/v4/entries/by-summoner/${id}`

        let data = await this.r.makeRequest<RankedData[]>(url)

        if ((data as errorResponse)?.status) return null

        return data as RankedData[]
    }

    static async getMatches(
        id: EncryptedPuuid,
        route: string,
        count?: string | null,
        queue?: string | null
    ): Promise<Array<string>> {
        let url =
            `https://${route}.api.riotgames.com/lol/match/v5/matches/by-puuid/${id}/ids?start=0&count=${
                count ? count : 1
            }` + (queue ? `&queue=${queue}` : '')

        let data = await this.r.makeRequest<Array<string>>(url)

        if ((data as errorResponse)?.status) return []

        return data as Array<string>
    }

    static async getMatch(id: string, route: string): Promise<null | normalMatch | cherryMatch> {
        let url = `https://${route}.api.riotgames.com/lol/match/v5/matches/${id}`

        let data = await this.r.makeRequest<normalMatch | cherryMatch>(url)

        if ((data as errorResponse)?.status) return null

        return data as normalMatch | cherryMatch
    }

    static async getRotation(region: string): Promise<Rotation | null> {
        let url = `https://${region}.api.riotgames.com/lol/platform/v3/champion-rotations`

        let data = await this.r.makeRequest<Rotation>(url)

        if ((data as errorResponse).status) return null

        return data as Rotation | null
    }

    static async getTournament(region: string): Promise<null | TournamentData[]> {
        let url = `https://${region}.api.riotgames.com/lol/clash/v1/tournaments`

        let data = await this.r.makeRequest<TournamentData>(url)

        if ((data as errorResponse).status) return null

        return data as TournamentData[] | null
    }
}

export default Riot
