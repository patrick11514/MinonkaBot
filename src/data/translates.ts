import { region, regions, routingValue, routingValues } from '$/lib/RiotAPI'
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
            success: z.string(),
            alreadyLinked: z.string(),
        }),
        manage: z.object({
            noAccounts: z.string(),
            title: z.string(),
            riotIdAccounts: z.string(),
            userRegAccounts: z.string(),
            manage: z.string(),
            add: z.string(),
            remove: z.string(),
        }),
        remove: z.object({
            title: z.string(),
            noAccounts: z.string(),
            error: z.string(),
            success: z.string(),
        }),
    }),
    global: z.object({
        regions: z.record(regionIndex, z.string()),
        regionsFull: z.record(regionIndex, z.string()),
        routingValues: z.record(routingIndex, z.string()),
        error: z.string(),
        unknownUser: z.string(),
        adminError: z.string(),
    }),
    language: z.object({
        info: z.string(),
        success: z.string(),
    }),
    account: z.object({
        riot: z.string(),
        username: z.string(),
        title: z.string(),
    }),
    profile: z.object({
        roleMention: z.string(),
        missing: z.string(),
        noAccounts: z.string(),
        invalidAccount: z.string(),
        badArguments: z.string(),
        invalidRiotId: z.string(),
    }),
})

export type phrases = z.infer<typeof phrasesSchema>

const schema = z.object({
    cs: phrasesSchema,
    en: phrasesSchema,
})

export const regionTranslates: Record<region, string> = {
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

export const regionTranslatesFull: Record<region, string> = {
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

export type languageData = (typeof translate)[language]

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
                success: 'Účet byl úspěšně propojen.',
                alreadyLinked: 'Tento účet již je s někým propojen.',
            },
            manage: {
                noAccounts: 'Nemáš žádný propojený účet.',
                title: 'Propojené účty',
                riotIdAccounts: 'Riot ID účty',
                userRegAccounts: 'Summoner name účty',
                manage: 'Spravovat účty',
                add: 'Přidat účet',
                remove: 'Odebrat účet',
            },
            remove: {
                title: 'Vyber si účet, který chceš odebrat',
                noAccounts: 'Nemáš žádný propojený účet.',
                error: 'Nepovedlo se odebrat účet, zkus to prosím později.',
                success: 'Účet byl úspěšně odebrán.',
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
            error: 'Něco se pokazilo, zkus to prosím později.',
            unknownUser: 'Zadal jsi neplatné jméno, nebo tag, zkus to prosím znovu.',
            adminError: 'Nastala chyba, kontaktuj prosím administrátora.',
        },
        language: {
            info: 'Tvůj aktuální jazyk je:',
            success: 'Tvůj jazyk byl změněn na:',
        },
        account: {
            riot: 'Riot',
            username: 'Summoner jméno',
            title: 'Vyber si účet, který chceš použít',
        },
        profile: {
            roleMention: 'Označ prosím nějakého uživatele.',
            missing: 'Nepovedlo se získat data od uživatele, zkus to prosím znova později.',
            noAccounts: 'Tento uživatel nemá propojený žádný účet.',
            badArguments: 'Zadal jsi neplatnou kombinaci argumentů.',
            invalidAccount: 'Zadaný účet je neplatný.',
            invalidRiotId: 'Zadal jsi neplatné RiotId. (Jméno#Tag)',
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
                success: 'Account was successfully linked.',
                alreadyLinked: 'This account is already linked with someone.',
            },
            manage: {
                noAccounts: "You don't have any linked accounts.",
                title: 'Linked accounts',
                riotIdAccounts: 'Riot ID accounts',
                userRegAccounts: 'Summoner name accounts',
                manage: 'Manage accounts',
                add: 'Add account',
                remove: 'Remove account',
            },
            remove: {
                title: 'Select account you want to remove',
                noAccounts: "You don't have linked any accounts.",
                error: "Couldn't remove account, please try again later.",
                success: 'Account was successfully removed.',
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
            error: 'Something went wrong, please try again later.',
            unknownUser: 'You entered invalid name or tag, please try again.',
            adminError: 'An error has occurred, please contact the administrator.',
        },
        language: {
            info: 'Your current language is:',
            success: 'Your language has been changed to:',
        },
        account: {
            riot: 'Riot',
            username: 'Summoner name',
            title: 'Select account you want to use',
        },
        profile: {
            roleMention: 'Plese select user.',
            missing: 'Unable to get data from user, please try again later.',
            noAccounts: "This user doesn't have linked any account.",
            badArguments: "You've entered an invalid combination of arguments.",
            invalidAccount: "You've entered an invalid account.",
            invalidRiotId: "You've entered an invalid RiotId. (Name#Tag)",
        },
    },
}

export const langaugeList = Object.keys(translate) as language[]

export const languageTranslations: Record<language, string> = {
    cs: 'Čeština',
    en: 'English',
}
