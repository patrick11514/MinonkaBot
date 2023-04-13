import { ChatInputCommandInteraction, Client } from 'discord.js'
import commands from '../commands'

export default (client: Client) => {
    let e = client.emitter

    e.on('command', async (interaction: ChatInputCommandInteraction) => {
        if (interaction.commandName === 'help') {
            let value = interaction.options.getString('command', false)

            if (!value) {
                let message = '**Seznam příkazů:**\nPro zobrazení podrobnost commandu použij /help <příkaz>\n\n'

                for (let command in commands) {
                    message += `- **</${command}:${client.commandsDB.get(command)}>** - ${
                        commands[command].description
                    }\n`
                }

                message +=
                    '\n*Miňonka is not endorsed by Riot Games and does not reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games and all associated properties are trademarks or registered trademarks of Riot Games, Inc*'

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
