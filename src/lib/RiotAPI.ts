import { env } from '$/types/env'
import { RankedData, challenge, challengeCategory, challengeLevel } from '$/types/riotTypes'
import { Endpoint, EndpointMethod } from '@patrick115/endpoints'
import { z } from 'zod'

export const regions = [
    'BR1',
    'EUN1',
    'EUW1',
    'JP1',
    'KR',
    'LA1',
    'LA2',
    'NA1',
    'OC1',
    'TR1',
    'RU',
    'PH2',
    'SH2',
    'TH2',
    'TW2',
    'VN2',
] as const

export type region = (typeof regions)[number]

export const routingValues = ['AMERICAS', 'ASIA', 'EUROPE', 'SEA'] as const

export type routingValue = (typeof routingValues)[number]

export const routingValuesToRegions = {
    AMERICAS: ['NA1', 'BR1', 'LA1', 'LA2'],
    ASIA: ['KR', 'JP1'],
    EUROPE: ['EUN1', 'EUW1', 'TR1', 'RU'],
    SEA: ['OC1', 'PH2', 'SG2', 'TH2', 'TW2', 'VN2'],
} as const

const BASE_URL = 'api.riotgames.com'

export const errorSchema = z.object({
    status: z.object({
        message: z.string().optional(),
        status_code: z.number(),
    }),
})

const getEndpoint = <T>(endpoint: string, method: EndpointMethod, schema: z.ZodType<T>) => {
    return new Endpoint({
        endpoint,
        method,
        schema,
        headers: {
            'X-Riot-Token': env.RIOT_TOKEN,
        },
        errorSchema,
    })
}

export class RiotAPI {
    /**
     * Get account by RiotId (name + tag)
     * @param routingValue routingValue for the api where to search the account
     * @param gameName name part of RiotId
     * @param tagLine tag part of RiotId
     * @returns Generated endpoint to fetch the account
     */
    public static getAccountByRiotId(routingValue: routingValue, gameName: string, tagLine: string) {
        return getEndpoint(
            `https://${routingValue}.${BASE_URL}/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`,
            'GET',
            z.object({
                puuid: z.string().min(78).max(78),
                gameName: z.string().min(gameName.length).max(gameName.length),
                tagLine: z.string().min(tagLine.length).max(tagLine.length),
            }),
        )
    }

    /**
     * Get account by username and region
     * @deprecated Use getAccountByRiotId instead
     * @param region Region in which the account is located
     * @param username Summoner name
     * @returns Generated endpoint to fetch the account
     */
    public static getAccountByUsername(region: region, username: string) {
        return getEndpoint(
            `https://${region}.${BASE_URL}/lol/summoner/v4/summoners/by-name/${username}`,
            'GET',
            z.object({
                id: z.string(),
                accountId: z.string(),
                puuid: z.string().min(78).max(78),
                name: z.string().min(username.length).max(username.length),
                profileIconId: z.number(),
                revisionDate: z.number(),
                summonerLevel: z.number(),
            }),
        )
    }

    /**
     * Get account by puuid
     * @param region Region in which the account is located
     * @param puuid Encrypted PUUID of the account
     * @returns Generated endpoint to fetch the account
     */
    public static getAccountByPuuid(region: region, puuid: string) {
        return getEndpoint(
            `https://${region}.${BASE_URL}/lol/summoner/v4/summoners/by-puuid/${puuid}`,
            'GET',
            z.object({
                id: z.string(),
                accountId: z.string(),
                puuid: z.string().min(78).max(78),
                name: z.string(),
                profileIconId: z.number(),
                revisionDate: z.number(),
                summonerLevel: z.number(),
            }),
        )
    }

    public static getAccountChallenges(region: region, puuid: string) {
        return getEndpoint(
            `https://${region}.${BASE_URL}/lol/challenges/v1/player-data/${puuid}`,
            'GET',
            z.object({
                totalPoints: z.object({
                    level: challengeLevel.optional(),
                    current: z.number(),
                    max: z.number(),
                    percentile: z.number().optional(),
                }),
                categoryPoints: z.record(
                    challengeCategory,
                    z.object({
                        level: challengeLevel,
                        current: z.number(),
                        max: z.number(),
                        percentile: z.number().optional(),
                    }),
                ),
                challenges: z.array(challenge),
                preferences: z.object({
                    bannerAccent: z.string().optional(),
                    title: z.string().optional(),
                    challengeIds: z.array(z.number()).optional(),
                    crestBorder: z.string().optional(),
                    prestigeCrestBorderLevel: z.number().optional(),
                }),
            }),
        )
    }

    public static getAccountRanks(region: region, summonerId: string) {
        return getEndpoint(
            `https://${region}.${BASE_URL}/lol/league/v4/entries/by-summoner/${summonerId}`,
            'GET',
            z.array(RankedData),
        )
    }
}
