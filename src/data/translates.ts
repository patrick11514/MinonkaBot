import { region, regions, routingValue, routingValues } from '$lib/RiotAPI'
import { z } from 'zod'

const regionIndex = z.custom<region>((val) => {
    if (typeof val !== 'string') return false
    if (!regions.includes(val as region)) return false
    return true
})

const routingIndex = z.custom<routingValue>((val) => {
    if (typeof val !== 'string') return false
    if (!routingValues.includes(val as routingValue)) return false
    return true
})

const phrasesSchema = z.object({
    link: z.object({
        method: z.object({
            title: z.string(),
            riotId: z.string(),
            userReg: z.string(),
        }),
        modal: z.object({
            title: z.string(),
            summonerName: z.string(),
            riotIdName: z.string(),
            riotIdNamePlaceholder: z.string(),
            riotIdTag: z.string(),
            riotIdTagPlaceholder: z.string(),
        }),
        regionOrServer: z.object({
            message: z.string(),
            placeholder: z.string(),
        }),
        process: z.object({
            error: z.string(),
            unknownUser: z.string(),
            adminError: z.string(),
            success: z.string(),
        }),
    }),
    global: z.object({
        regions: z.record(regionIndex, z.string()),
        regionsFull: z.record(regionIndex, z.string()),
        routingValues: z.record(routingIndex, z.string()),
    }),
})

const schema = z.object({
    cs: phrasesSchema,
    en: phrasesSchema,
})

const regionTranslates: Record<region, string> = {
    BR1: 'BR',
    EUN1: 'EUNE',
    EUW1: 'EUW',
    JP1: 'JP',
    KR: 'KR',
    LA1: 'LAN',
    LA2: 'LAS',
    NA1: 'NA',
    OC1: 'OCE',
    TR1: 'TR',
    RU: 'RU',
    PH2: 'PH',
    SH2: 'SG',
    TH2: 'TH',
    TW2: 'TW',
    VN2: 'VN',
}

const regionTranslatesFull: Record<region, string> = {
    BR1: 'Brazil',
    EUN1: 'Europe Nordic & East',
    EUW1: 'Europe West',
    JP1: 'Japan',
    KR: 'Korea',
    LA1: 'Latin America North',
    LA2: 'Latin America South',
    NA1: 'North America',
    OC1: 'Oceania',
    TR1: 'Turkey',
    RU: 'Russia',
    PH2: 'Philippines',
    SH2: 'Singapore',
    TH2: 'Thailand',
    TW2: 'Taiwan',
    VN2: 'Vietnam',
}

export type language = keyof z.infer<typeof schema>

export const translate: z.infer<typeof schema> = {
    cs: {
        link: {
            method: {
                title: 'Vyber si propojovací metodu',
                riotId: 'Riot ID (Jméno + Tag)',
                userReg: 'Uživatelské jméno + Region (zastaralé)',
            },
            modal: {
                title: 'Propojování účtů',
                summonerName: 'Summoner name',
                riotIdName: 'Riot ID jméno',
                riotIdNamePlaceholder: 'Jméno',
                riotIdTag: 'Tag',
                riotIdTagPlaceholder: 'SuperTag',
            },
            regionOrServer: {
                message: 'Vyber si region, ve kterém byl tvůj účet vytvořen (Rychlejší vyhledávání)',
                placeholder: 'Vyber region',
            },
            process: {
                error: 'Něco se pokazilo, zkus to prosím později.',
                unknownUser: 'Zadal jsi neplatné jméno, nebo tag, zkus to prosím znovu.',
                adminError: 'Nastala chyba, kontaktuj prosím administrátora.',
                success: 'Účet byl úspěšně propojen.',
            },
        },
        global: {
            regions: regionTranslates,
            regionsFull: regionTranslatesFull,
            routingValues: {
                AMERICAS: 'Amerika',
                ASIA: 'Asie',
                EUROPE: 'Evropa',
                SEA: 'Jihovýchodní Asie',
            },
        },
    },
    en: {
        link: {
            method: {
                title: 'Select connection method',
                riotId: 'Riot ID (GameName + TagLine)',
                userReg: 'Username + Region (deprecated)',
            },
            modal: {
                title: 'Account linking',
                summonerName: 'Summoner name',
                riotIdName: 'Riot ID name',
                riotIdNamePlaceholder: 'Name',
                riotIdTag: 'Tag',
                riotIdTagPlaceholder: 'CoolTag',
            },
            regionOrServer: {
                message: 'Select region where your account was created (Faster search)',
                placeholder: 'Select region',
            },
            process: {
                error: 'Something went wrong, please try again later.',
                unknownUser: 'You entered invalid name or tag, please try again.',
                adminError: 'An error has occurred, please contact the administrator.',
                success: 'Account was successfully linked.',
            },
        },
        global: {
            regions: regionTranslatesFull,
            regionsFull: regionTranslatesFull,
            routingValues: {
                AMERICAS: 'Americas',
                ASIA: 'Asia',
                EUROPE: 'Europe',
                SEA: 'South East Asia',
            },
        },
    },
}
