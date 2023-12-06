import { language, phrases, translate } from '$/data/translates'
import { DiscordEvent } from '$/hooks'
import { db } from '$/types/connection'
import { RiotAPILanguages } from '$/types/types'
import { RepliableInteraction } from 'discord.js'
import fetch from 'node-fetch'
import fs from 'node:fs'
import path from 'node:path'
import { Worker } from 'node:worker_threads'
import sharp from 'sharp'
import { Accounts } from './Accounts'
import { Link } from './Link'
import { RiotAPI, region, routingValue, routingValuesToRegions } from './RiotAPI'
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

export const DEFAULT_IMAGE = 'profileicon/29'

export const validateImage = async (data: Buffer) => {
    try {
        await sharp(data).toBuffer()
    } catch (_) {
        const request = await fetch(getImageFile(DEFAULT_IMAGE))
        const data = await request.buffer()
        return data
    }
    return data
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

export const generateEvents = (
    commandName: string,
    puuidRegion: (interaction: RepliableInteraction, puuid: string, region: region) => Promise<void>,
) => {
    return new DiscordEvent('interactionCreate', async (interaction) => {
        if (!interaction.isChatInputCommand()) return
        if (interaction.commandName !== commandName) return

        const mention = interaction.options.getMentionable('mention')
        const riotId = interaction.options.getString('riot_id')
        const summonerName = interaction.options.getString('summoner_name')
        const region = interaction.options.getString('region') as region | null

        const language = await getLanguageData(interaction.user.id)

        if (mention !== null) {
            const role = interaction.options.getRole('mention')
            const user = interaction.options.getMember('mention')

            if (role || !user) {
                interaction.reply({
                    ephemeral: true,
                    content: language.profile.roleMention,
                })
                return
            }

            if (!('user' in user)) {
                interaction.reply({
                    ephemeral: true,
                    content: language.profile.missing,
                })
                return
            }

            //handle mention
            getProfileById(interaction, user.id, puuidRegion)
        } else if (riotId !== null && region !== null) {
            //handle riotId

            if (!riotId.includes('#')) {
                interaction.reply({
                    ephemeral: true,
                    content: language.profile.invalidRiotId,
                })
                return
            }

            const [gameName, tagLine] = riotId.split('#')

            const endpoint = RiotAPI.getAccountByRiotId(getRoutingValue(region), gameName, tagLine)
            const data = await endpoint.fetchSafe()

            const link = new Link()

            if (!data.status) {
                link.checkError(data, interaction, language)
                return
            }

            const { puuid } = data.data

            puuidRegion(interaction, puuid, region)
        } else if (summonerName !== null && region !== null) {
            //handle summonerName and region

            const endpoint = RiotAPI.getAccountByUsername(region, summonerName)
            const data = await endpoint.fetchSafe()

            const account = new Accounts(interaction.user.id, language)

            if (!data.status) {
                const error = account.getError(data)

                interaction.reply({
                    ephemeral: true,
                    content: error,
                })
                return
            }

            const { puuid } = data.data

            puuidRegion(interaction, puuid, region)
        } else if (mention === null && riotId === null && summonerName === null && region === null) {
            //Handle myself
            getProfileById(interaction, interaction.user.id, puuidRegion)
        } else {
            await interaction.reply({
                ephemeral: true,
                content: language.profile.badArguments,
            })
        }
    })
}

const getProfileById = async (
    interaction: RepliableInteraction,
    userId: string,
    fnc: (interaction: RepliableInteraction, puuid: string, region: region) => Promise<void>,
) => {
    const language = await getLanguageData(interaction.user.id)
    const account = new Accounts(userId, language)

    const accounts = await account.getAllAccounts()

    if (accounts.length == 0) {
        interaction.reply({
            ephemeral: true,
            content: language.profile.noAccounts,
        })
    } else if (accounts.length > 1) {
        account.selectAccount(interaction, fnc)
    } else {
        const account = accounts[0]
        fnc(interaction, account.puuid, account.region)
    }
}
