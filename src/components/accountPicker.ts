import { Client, Interaction } from 'discord.js'

class accountPicker {
    construct(
        accounts: Array<{
            name: string
            region: string
        }>,
        client: Client,
        interaction: Interaction,
        edit: boolean = false
    ) {}
}

export default accountPicker
