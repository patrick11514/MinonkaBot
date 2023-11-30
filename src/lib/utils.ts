import { language, phrases, translate } from '$/data/translates'
import { db } from '$/types/connection'
import { RiotAPILanguages } from '$/types/types'
import fetch from 'node-fetch'
import fs from 'node:fs'
import path from 'node:path'
import { Worker } from 'node:worker_threads'
import { region, routingValue, routingValuesToRegions } from './RiotAPI'
import { checkCache, getCache, saveToCache, toFileName } from './cache'

if (process.env.TS_NODE_DEV) {
    ////COMPILE DRAWING FILES, BEACUSE IT IS ONLY USED IN WORKERS (customFiles) FOLDER
    fs.readdirSync(path.join(__dirname, 'drawing'))
        .map((file) => path.join(__dirname, 'drawing', file))
        .filter((file) => file.endsWith('.ts') || file.endsWith('.js'))
        .forEach((file) => {
            require(file)
        })
}

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

export const getDataFile = (file: string, language: 'cs_CZ' | 'en_US') => {
    return `https://ddragon.leagueoflegends.com/cdn/${process.LOL_VERSION}/data/${language}/${file}`
}

export const getImageFile = (file: string) => {
    return `https://ddragon.leagueoflegends.com/cdn/${process.LOL_VERSION}/img/${file}.png`
}

export const getStaticImageFile = (file: string) => {
    return `https://ddragon.leagueoflegends.com/cdn/img/${file}.png`
}

export const getTitle = async (titleId: string, language: RiotAPILanguages) => {
    const url = getDataFile('challenges.json', language)
    const name = toFileName(url)

    const fullId = parseInt(titleId)
    const id = Math.floor(fullId / 100)
    const level = fullId % 100

    type dataType = {
        id: number
        thresholds: Record<
            string,
            {
                rewards?: {
                    category: 'TITLE'
                    quantity: number
                    title: string
                }[]
            }
        >
    }[]

    let data: dataType

    if (checkCache(name)) {
        const buffer = getCache(name)
        data = JSON.parse(buffer.toString()) as dataType
    } else {
        const request = await fetch(url)
        data = await request.json()

        saveToCache(name, Buffer.from(JSON.stringify(data)))
    }

    const challenge = data.find((d) => d.id === id)

    if (!challenge || !challenge.thresholds) {
        return ''
    }

    const values = Object.values(challenge.thresholds)
    const currentLevel = values[level]

    if (!currentLevel || !currentLevel.rewards) {
        return ''
    }

    const titleReward = currentLevel.rewards.find((reward) => reward.category == 'TITLE')

    if (!titleReward) {
        return ''
    }

    return titleReward.title
}

export const makeThread = async (customFile: string, data: any) => {
    return new Promise<Buffer>((resolve, reject) => {
        const resolved = require.resolve(path.join(__dirname, 'drawing/customFiles', customFile))

        const worker = new Worker(resolved, {
            workerData: {
                data: data,
                version: process.LOL_VERSION,
            },
        })

        worker.on('message', (data: Uint8Array) => {
            const buffer = Buffer.from(data as Uint8Array)

            resolve(buffer)
        })

        worker.on('error', (err) => {
            reject(err)
        })

        worker.on('exit', (code) => {
            if (code !== 0) {
                reject(code)
            }
        })
    })
}
