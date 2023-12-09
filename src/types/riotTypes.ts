import { z } from 'zod'

export const challengeLevel = z
    .literal('NONE')
    .or(z.literal('IRON'))
    .or(z.literal('BRONZE'))
    .or(z.literal('SILVER'))
    .or(z.literal('GOLD'))
    .or(z.literal('PLATINUM'))
    .or(z.literal('DIAMOND'))
    .or(z.literal('MASTER'))
    .or(z.literal('GRANDMASTER'))
    .or(z.literal('CHALLENGER'))

export type challengeLevel = z.infer<typeof challengeLevel>

export const challengeCategory = z
    .literal('COLLECTION')
    .or(z.literal('TEAMWORK'))
    .or(z.literal('VETERANCY'))
    .or(z.literal('IMAGINATION'))
    .or(z.literal('EXPERTISE'))

export const challenge = z.object({
    challengeId: z.number(),
    percentile: z.number(),
    position: z.number().optional(),
    playersInLevel: z.number().optional(),
    level: challengeLevel,
    value: z.number(),
    achievedTime: z.number().optional(),
})

export type challengeType = z.infer<typeof challenge>

export const tier = z
    .literal('IRON')
    .or(z.literal('BRONZE'))
    .or(z.literal('SILVER'))
    .or(z.literal('GOLD'))
    .or(z.literal('PLATINUM'))
    .or(z.literal('EMERALD'))
    .or(z.literal('DIAMOND'))
    .or(z.literal('MASTER'))
    .or(z.literal('GRANDMASTER'))
    .or(z.literal('CHALLENGER'))
export type tier = z.infer<typeof tier>
export const rank = z.literal('I').or(z.literal('II')).or(z.literal('III')).or(z.literal('IV')).or(z.literal('V'))

export const RankedData = z.object({
    leagueId: z.string().optional(),
    queueType: z.literal('RANKED_FLEX_SR').or(z.literal('RANKED_SOLO_5x5')).or(z.literal('CHERRY')),
    tier: tier.optional(),
    rank: rank.optional(),
    leaguePoints: z.number(),
    wins: z.number(),
    losses: z.number(),
    veteran: z.boolean(),
    inactive: z.boolean(),
    freshBlood: z.boolean(),
    hotStreak: z.boolean(),
    summonerId: z.string(),
    summonerName: z.string(),
})

export type RankedData = z.infer<typeof RankedData>
