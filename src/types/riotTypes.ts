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
