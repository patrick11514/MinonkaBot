interface Challenge {
    id: number
    name: string
    description: string
    shortDescription: string
    hasLeaderboard: boolean
    thresholds: {
        [key in
            | 'IRON'
            | 'BRONZE'
            | 'SILVER'
            | 'GOLD'
            | 'PLATINUM'
            | 'DIAMOND'
            | 'MASTER'
            | 'GRANDMASTER'
            | 'CHALLENGER']: {
            value: number
            rewards?: Array<{
                category: 'TITLE'
                quantity: number
                title: string
            }>
        }
    }
}

interface UserChallenges {
    totalPoints: {
        level: string
        current: number
        max: number
        percentile: number
    }
    categoryPoints: {
        [name: string]: {
            level: string
            current: number
            max: number
            percentile: number
        }
    }
    challenges: Array<{
        challengeId: number
        percentile: number
        level: string
        value: number
        achievedTime: number
    }>
    preferences: {
        bannerAccent: string
        title: string
        challengeIds: Array<number>
    }
}

type EncryptedSummonerId = string
type EncryptedAccountId = string
type EncryptedPuuid = string

interface SummonerBy {
    id: EncryptedSummonerId
    accountId: EncryptedAccountId
    puuid: EncryptedPuuid
    name: string
    profileIconId: number
    revisionDate: number
    summonerLevel: number
}

enum QueueTypes {
    RANKED_SOLO = 'RANKED_SOLO_5x5',
    RANKED_FLEX = 'RANKED_FLEX_SR',
}

enum Tiers {
    Iron = 'IRON',
    Bronze = 'BRONZE',
    Silver = 'SILVER',
    Gold = 'GOLD',
    Platinum = 'PLATINUM',
    Diamond = 'DIAMOND',
    Master = 'MASTER',
    Grandmaster = 'GRANDMASTER',
    Challenger = 'CHALLENGER',
}

enum Ranks {
    I = 'I',
    II = 'II',
    III = 'III',
    IV = 'IV',
}
interface RankedData {
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
}

export {
    Challenge,
    UserChallenges,
    SummonerBy,
    EncryptedAccountId,
    EncryptedSummonerId,
    EncryptedPuuid,
    QueueTypes,
    Tiers,
    Ranks,
    RankedData,
}
