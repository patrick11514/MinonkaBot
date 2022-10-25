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

interface SummonerByName {
    id: EncryptedSummonerId
    accountId: EncryptedAccountId
    puuid: EncryptedPuuid
    name: string
    profileIconId: number
    revisionDate: number
    summonerLevel: number
}

export { Challenge, UserChallenges, SummonerByName, EncryptedAccountId, EncryptedSummonerId, EncryptedPuuid }
