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
    length: number
    ff15: boolean
    queue: queues
    lp: number | undefined | null
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
    teams: Array<
        Array<{
            id: number
            champion: number
            summoner: string
            role: string
            summoners: number[]
            items: number[]
            kills: number
            asists: number
            deaths: number
            vision: number
            level: number
        }>
    >
}

export { profilePicture, rankedProfile, matchData }
