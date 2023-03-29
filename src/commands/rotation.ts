import { Client, CommandInteraction } from 'discord.js'
import JSONdb from 'simple-json-db'
import Logger from '../lib/logger'
import Riot from '../lib/riot/core'
import utilities from '../lib/riot/utilities'

export default (client: Client) => {
    let e = client.emitter
    let l = new Logger('Rotation', 'color')

    e.on('command', async (interaction: CommandInteraction) => {
        if (interaction.commandName === 'rotation') {
            let param = interaction.options.get('region', false)
            command(interaction, param?.value as string)
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

        message.push(`<${emote}> ${champion.name}`)
    }

    return message.join(', ')
}
export async function command(interaction: CommandInteraction, region?: string) {
    let db = new JSONdb<{
        champions: number[]
        updated: number
    }>('databases/rotation.json')

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
                }**\n${message}\n*Poslední aktualizace: ${date.toLocaleString()}*`
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

    for (let regId in data) {
        let region = data[regId]
        if (!region) continue

        let mapped = rotations.map((r) => r.ids)

        for (let id in mapped) {
            let rot = mapped[id]
            if (rot.every((id) => region?.freeChampionIds.includes(id))) {
                rotations[id].regions.push(interaction.client.config.regions[regId])
            } else {
                rotations.push({
                    regions: [interaction.client.config.regionTranslates[regId]],
                    ids: region.freeChampionIds,
                })
            }
        }
    }

    if (rotations.length == 0) {
        return interaction.editReply('Nepovedlo se získat rotaci.')
    }

    for (let rotation of rotations) {
        let champs = await fromIds(rotation.ids, interaction.client.emotesDB)
        message += `**${rotation.regions.join(', ')}**:\n${champs}\n`
    }

    return interaction.editReply(message)
}
