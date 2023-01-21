import { EncryptedSummonerId, queues, QueueTypes, Ranks, Tiers } from './riotApi'

interface profilePicture {
    username: string
    level: number
    iconId: number
    title: string
    challenges: Array<{
        id: number
        tier: string
    }>
}

interface rankedProfile {
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

interface matchData {
    queue: queues
    userTeam: number
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
    teams: Array<
        Array<{
            id: number
            champion: number
            summoner: string
            role: string
            items: number[]
            kills: number
            asists: number
            deaths: number
        }>
    >
}

export { profilePicture, rankedProfile, matchData }
