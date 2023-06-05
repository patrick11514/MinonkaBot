import { ClashAction } from '$types/types'
import { ButtonInteraction, ChatInputCommandInteraction, Client, User } from 'discord.js'
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
        schedule(region)
    }
}

async function schedule(region: string | null) {
    if (!region) {
    }
}
