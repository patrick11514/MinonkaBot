import { language, phrases, translate } from '$/data/translates'
import { db } from '$/types/connection'
import { region, routingValue, routingValuesToRegions } from './RiotAPI'

const memory = process.memory

export const getLanguage = async (id: string) => {
    let lang: language
    if (memory.includes(id)) {
        lang = memory.get(id) as language
    } else {
        const data = await db.selectFrom('languages').select('language').where('user_id', '=', id).executeTakeFirst()

        lang = data ? data.language : 'en'
    }

    return lang
}

export const getLanguageData = async (id: string): Promise<phrases> => {
    const language = await getLanguage(id)

    return translate[language]
}

export const getLanguageDataFromLang = (language: language): phrases => {
    return translate[language]
}

export const getRoutingValue = (region: region): routingValue => {
    let routingValue: routingValue | undefined = undefined

    for (const [rValue, regions] of Object.entries(routingValuesToRegions)) {
        if (regions.includes(region)) {
            routingValue = rValue as routingValue
            break
        }
    }

    if (routingValue === undefined) throw new Error('Invalid region')

    return routingValue
}
