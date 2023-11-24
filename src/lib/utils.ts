import { language, translate } from '$data/translates'
import { db } from '$types/connection'

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

export const getLanguageData = async (id: string) => {
    const language = await getLanguage(id)

    return translate[language]
}

export const getLanguageDataFromLang = (language: language) => {
    return translate[language]
}
