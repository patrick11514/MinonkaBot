import { cherryTeamMember, EncryptedSummonerId, queues, QueueTypes, Ranks, teamMember, Tiers } from './riotApi'

export interface profilePicture {
    username: string
    level: number
    iconId: number
    title: string
    challenges: Array<{
        id: number
        tier: string
    }>
    region: string
}

export interface rankedProfile {
    profileIconId: number
    summonerName: string
    level: number
    rankeds: Array<{
        leagueId: string
        queueType: QueueTypes
        tier: Tiers
        rank: Ranks
        summonerId: EncryptedSummonerId
        summonerName: string
        leaguePoints: number
        wins: number
        losses: number
        veteran: boolean
        inactive: boolean
        freshBlood: boolean
        hotStreak: boolean
        miniSeries?: {
            target: number
            wins: number
            losses: number
            progress: string
        }
    }>
}

interface baseMatchData {
    userId: string
    length: number
    ff15: boolean
    queue: queues
    lp: number | undefined | null | string
    userTeam: number
    createTimestamp: number
    bans: Array<{
        id: number
        bans: Array<{
            champion: number
            pickTurn: number
        }>
    }>
    wins: Array<{
        id: number
        win: boolean
    }>
}

export interface matchData extends baseMatchData {
    teams: Array<Array<teamMember>>
}

export interface cherryMatchData extends baseMatchData {
    teams: Array<Array<cherryTeamMember>>
}
