import { ChatInputCommandInteraction, Client } from 'discord.js'
import JSONdb from 'simple-json-db'
import Logger from '../lib/logger'
import Riot from '../lib/riot/core'
import utilities from '../lib/riot/utilities'

export default (client: Client) => {
    let e = client.emitter
    let l = new Logger('Rotation', 'color')

    e.on('command', async (interaction: ChatInputCommandInteraction) => {
        if (interaction.commandName === 'rotation') {
            let param = interaction.options.getString('region', false)
            command(interaction, param)
        }
    })
}

async function fromIds(ids: Array<number>, emotes: JSONdb) {
    let message = []
    for (let id of ids) {
        let champion = await utilities.championIdToObject(id)
        if (!champion) continue
        if (!emotes.has('champ@' + champion.id)) continue

        let emote = emotes.get('champ@' + champion.id)

        message.push(`<:${emote}> ${champion.name}`)
    }

    return message.join(', ')
}
export async function command(interaction: ChatInputCommandInteraction, region: string | null) {
    let db = new JSONdb<{
        champions: number[]
        updated: number
    }>('databases/rotation.json', {
        jsonSpaces: false,
        asyncWrite: false,
        syncOnWrite: true,
    })

    if (region) {
        let rotation = await Riot.getRotation(region)

        if (!rotation) {
            if (!db.has(region)) {
                return interaction.editReply('Nepovedlo se získat rotaci.')
            }

            let rotation = db.get(region) as {
                champions: number[]
                updated: number
            }

            let message = await fromIds(rotation.champions, interaction.client.emotesDB)

            let date = new Date(rotation.updated)

            return interaction.editReply(
                `**Champion rotace pro server ${
                    interaction.client.config.regionTranslates[region]
                }**\n${message}\n*Platné k: ${date.toLocaleString('cs-CZ')}*`
            )
        }

        db.set(region, {
            champions: rotation.freeChampionIds,
            updated: Date.now(),
        })

        let message = await fromIds(rotation.freeChampionIds, interaction.client.emotesDB)

        return interaction.editReply(
            `**Champion rotace pro server ${interaction.client.config.regionTranslates[region]}**\n${message}`
        )
    }

    let message = ''

    let fcs = []

    for (let region of interaction.client.config.regions) {
        fcs.push(Riot.getRotation(region))
    }

    let data = await Promise.all(fcs)

    let rotations: Array<{
        regions: Array<string>
        ids: Array<number>
    }> = []

    let unsucessfull = []
    let gotButCache: Array<{
        region: string
        date: number
    }> = []

    for (let regId in data) {
        let region = data[regId]
        let regionName = interaction.client.config.regions[regId]
        if (!region) {
            if (db.has(regionName)) {
                let rotation = db.get(regionName) as {
                    champions: number[]
                    updated: number
                }

                region = {
                    freeChampionIds: rotation.champions,
                    freeChampionIdsForNewPlayers: [],
                    maxNewPlayerLevel: -1,
                }

                gotButCache.push({
                    region: regionName,
                    date: rotation.updated,
                })
            } else {
                unsucessfull.push(regionName)
                continue
            }
        } else {
            db.set(regionName, {
                champions: region.freeChampionIds,
                updated: Date.now(),
            })
        }

        let mapped = rotations.map((r) => r.ids)

        let found = false

        for (let id in mapped) {
            let rot = mapped[id]
            if (rot.every((id) => region?.freeChampionIds.includes(id))) {
                rotations[id].regions.push(interaction.client.config.regionTranslates[regionName])
                found = true
            }
        }

        if (!found) {
            rotations.push({
                regions: [interaction.client.config.regionTranslates[regionName]],
                ids: region.freeChampionIds,
            })
        }
    }

    if (rotations.length == 0) {
        return interaction.editReply('Nepovedlo se získat rotaci.')
    }

    for (let rotation of rotations) {
        let champs = await fromIds(rotation.ids, interaction.client.emotesDB)
        message += `**${rotation.regions.join(', ')}**:\n${champs}\n`
    }

    if (gotButCache.length > 0) {
        message += `\n**Rotace, které se nepodařilo získat, ale jsou v záloze:**\n${gotButCache
            .map(
                (r) =>
                    `${interaction.client.config.regionTranslates[r.region]}: ${new Date(r.date).toLocaleString(
                        'cs-CZ'
                    )}`
            )
            .join('\n')}\n`
    }

    if (unsucessfull.length > 0)
        message += `\n***Nepovedlo se získat rotaci pro** ${unsucessfull
            .map((reg) => interaction.client.config.regionTranslates[reg])
            .join(', ')}*`

    return interaction.editReply(message)
}
