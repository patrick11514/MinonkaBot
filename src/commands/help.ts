import { Client, CommandInteraction } from 'discord.js'
import commands from '../commands'

export default (client: Client) => {
    let e = client.emitter

    e.on('command', async (interaction: CommandInteraction) => {
        if (interaction.commandName === 'help') {
            let command = interaction.options.get('command', false)

            let value = command ? (command.value as string) : null

            if (!value) {
                let message = '**Seznam příkazů:**\nPro zobrazení podrobnost commandu použij /help <příkaz>\n\n'

                for (let command in commands) {
                    message += `- **${command}** - ${commands[command].description}\n`
                }

                await interaction.editReply(message)
            } else {
                if (!commands[value]) {
                    await interaction.editReply('Tento příkaz neexistuje!')
                    return
                }

                let message = `Podrobnosti příkazu **${value}**\n\nArgumenty:\n`

                for (let option of commands[value].options) {
                    message += `- **${option.name}** - ${option.description}\n`
                }

                await interaction.editReply(message)
            }
        }
    })
}
