import { EncryptedSummonerId, QueueTypes, Ranks, Tiers } from './riotApi'

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

export { profilePicture, rankedProfile }
