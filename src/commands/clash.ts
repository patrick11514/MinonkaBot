import Riot from '$lib/riot/core'
import u from '$lib/riot/utilities'
import { ClashAction, FakeInteraction, FakeInteractionArg } from '$types/types'
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ChatInputCommandInteraction,
    Client,
    MessageInteraction,
    User,
} from 'discord.js'
import Logger from '../lib/logger'

export default (client: Client) => {
    let e = client.emitter
    let l = new Logger('command', 'color')

    e.on('command', async (interaction: ChatInputCommandInteraction) => {
        if (interaction.commandName === 'clash') {
            let action = interaction.options.getString('action', true) as ClashAction
            let username = interaction.options.getString('username', false)
            let region = interaction.options.getString('region', false)
            let mention = interaction.options.getUser('mention', false)

            clash(username, region, mention, interaction, action)
        }
    })
}

export async function clash(
    username: string | null,
    region: string | null,
    mention: User | null,
    interaction: ChatInputCommandInteraction | ButtonInteraction,
    action: ClashAction
) {
    if (action == 'schedule') {
        schedule(region, interaction)
    }
}

export const ClashListener = () => {
    process.client.emitter.on('button', (interaction: ButtonInteraction) => {
        const id = interaction.customId.split('@')

        //remove first element
        id.shift()

        if (id.length < 4) return

        const key = id[0]
        const name = id[1]
        const region = id[2]
        const authorId = id[3]

        if (key != process.env.KEY) return
        if (name != 'region') return
        if (interaction.user.id != authorId) return

        if (!process.client.config.regions.includes(region)) return

        //remove buttons
        interaction.message.edit({
            content: 'Načítání...',
            components: [],
        })

        const message = interaction.message
        const rawInteraction = interaction.message.interaction as MessageInteraction

        const inter: FakeInteraction = {
            editReply: (content: FakeInteractionArg) => {
                return message.edit(content)
            },
            reply: (content: FakeInteractionArg) => {
                return message.reply(content)
            },
            client: {
                usersDB: process.client.usersDB,
                nameHistoryDB: process.client.nameHistoryDB,
                commandsDB: process.client.commandsDB,
                config: process.client.config,
                LPDB: process.client.LPDB,
            },
            user: {
                id: rawInteraction.user.id,
                name: rawInteraction.user.username,
            },
            fake: true,
        }

        schedule(region, inter)
    })
}

async function schedule(
    region: string | null,
    interaction: ChatInputCommandInteraction | ButtonInteraction | FakeInteraction
) {
    if (!region) {
        const rows: Array<ActionRowBuilder<ButtonBuilder>> = initRegionSelector(interaction.user.id)

        interaction.editReply({
            content: 'Vyber si region:',
            components: rows,
        })
        return
    }

    let data = await Riot.getTournament(region)

    if (!data || data.length == 0) {
        interaction.editReply('Nejsou naplánovány žádné clash turnaje. :cry: ')
        return
    }

    let text = '**Rozpis Následujících Clashů:**'

    data = data.filter((c) => c.schedule[0].startTime > Date.now())

    for (const clash of data) {
        text += '\n\n'
        text += `- **Pohár - ${u.firstUpper(clash.nameKey)} (Den ${clash.nameKeySecondary.split('_')[1]}):**\n`
        const start4 = clash.schedule[0].registrationTime / 1000
        //2h 15m from start 4
        const start3 = start4 + 2 * 60 * 60 + 15 * 60
        //45m from start 3
        const start2 = start3 + 45 * 60
        //30m from start 2
        const start1 = start2 + 30 * 60
        const end = clash.schedule[0].startTime / 1000
        text += `> Start Tier 4: <t:${start4}:f> (<t:${start4}:R>)\n`
        text += `> Start Tier 3: <t:${start3}:f> (<t:${start3}:R>)\n`
        text += `> Start Tier 2: <t:${start2}:f> (<t:${start2}:R>)\n`
        text += `> Start Tier 1: <t:${start1}:f> (<t:${start1}:R>)\n`
        text += `> Konec: <t:${end}:f> (<t:${end}:R>)`
    }

    interaction.editReply(text)
}

const initRegionSelector = (authorId: string) => {
    let regions = process.client.config.regions
    const translates = process.client.config.regionTranslates

    const rows: Array<ActionRowBuilder<ButtonBuilder>> = []

    const regionsList = []

    while (regions.length > 0) {
        regionsList.push(regions.slice(0, 5))
        regions = regions.slice(5)
    }

    for (let regs of regionsList) {
        const row = new ActionRowBuilder<ButtonBuilder>()

        for (let region of regs) {
            const id = `@${process.env.KEY}@region@${region}@${authorId}`

            row.addComponents(
                new ButtonBuilder().setLabel(translates[region]).setStyle(ButtonStyle.Primary).setCustomId(id)
            )
        }

        rows.push(row)
    }

    return rows
}
