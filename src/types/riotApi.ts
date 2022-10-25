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

type lowerTier =
    | 'Iron'
    | 'Bronze'
    | 'Silver'
    | 'Gold'
    | 'Platinum'
    | 'Diamond'
    | 'Master'
    | 'Grandmaster'
    | 'Challenger'

enum Ranks {
    I = 'I',
    II = 'II',
    III = 'III',
    IV = 'IV',
}

enum RankColors {
    Iron = '#99978b',
    Bronze = '#966502',
    Silver = '#99978b',
    Gold = '#e6c41c',
    Platinum = '#49ebaa',
    Diamond = '#5149eb',
    Master = '#8117b3',
    Grandmaster = '#9e0606',
    Challenger = '#e5f051',
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
    miniSeries?: {
        target: number
        wins: number
        losses: number
        progress: string
    }
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
    RankColors,
    lowerTier,
    RankedData,
}
