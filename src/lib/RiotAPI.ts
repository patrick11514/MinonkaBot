import { env } from '$types/env'
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
}
