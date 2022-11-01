import { ButtonInteraction, Client, CommandInteraction } from 'discord.js'
import accountPicker from '../components/accountPicker'
import handleInteraction from '../components/core'
import Images from '../lib/images/core'
import linkedAccounts from '../lib/nameHistory'
import Riot from '../lib/riot/core'
import { SummonerBy } from '../types/riotApi'

export default (client: Client) => {
    let e = client.emitter

    e.on('command', async (interaction: CommandInteraction) => {
        if (interaction.commandName === 'rank') {
            let username = interaction.options.get('username', false)
            let region = interaction.options.get('region', false)

            generateRank(username?.value as string, region?.value as string, interaction)
        }
    })
}

export async function generateRank(
    username: string | null,
    region: string | null,
    interaction: CommandInteraction | ButtonInteraction
) {
    handleInteraction(
        interaction,
        username,
        region,
        'rank',
        async function (
            username: string,
            region: string,
            data: SummonerBy,
            riot: Riot,
            interaction: CommandInteraction | ButtonInteraction
        ) {
            let rankedData = await riot.getRankedData(data.id, region)

            if (!rankedData) {
                interaction.editReply({ content: 'Nepovedlo se načíst data z Riot API!' })

                return
            }

            //save check history of account
            let accounts = new linkedAccounts(
                interaction.user.id,
                interaction.client.usersDB,
                interaction.client.nameHistoryDB
            )

            accounts.checkHistory([
                {
                    username: data.name,
                    id: data.id,
                    region: region,
                },
            ])

            //get image
            let images = new Images()

            let image = await images.generateRankedProfile({
                summonerName: data.name,
                level: data.summonerLevel,
                profileIconId: data.profileIconId,
                rankeds: rankedData,
            })

            interaction.editReply({ content: '', files: [image] })
        },
        []
    )
}
