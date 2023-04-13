import { ButtonInteraction, ChatInputCommandInteraction, Client, User } from 'discord.js'
import accountPicker from '../components/accountPicker'
import handleInteraction from '../components/core'
import Images from '../lib/images/core'
import linkedAccounts from '../lib/nameHistory'
import Riot from '../lib/riot/core'
import { SummonerBy } from '../types/riotApi'
import fs from 'fs'

export default (client: Client) => {
    let e = client.emitter

    e.on('command', async (interaction: ChatInputCommandInteraction) => {
        if (interaction.commandName === 'rank') {
            let username = interaction.options.getString('username', false)
            let region = interaction.options.getString('region', false)
            let mention = interaction.options.getUser('mention', false)

            generateRank(username, region, mention, interaction)
        }
    })
}

export async function generateRank(
    username: string | null,
    region: string | null,
    mention: User | null,
    interaction: ChatInputCommandInteraction | ButtonInteraction
) {
    handleInteraction(
        interaction,
        username,
        region,
        mention,
        'rank',
        async function (
            username: string,
            region: string,
            data: SummonerBy,
            interaction: ChatInputCommandInteraction | ButtonInteraction
        ) {
            let rankedData = await Riot.getRankedData(data.id, region)

            if (!rankedData) {
                interaction.editReply({ content: 'Nepovedlo se načíst data z Riot API!' })

                return
            }

            //get image
            let images = new Images()

            let image = await images.generateRankedProfile({
                summonerName: data.name,
                level: data.summonerLevel,
                profileIconId: data.profileIconId,
                rankeds: rankedData,
            })

            await interaction.editReply({ content: '', files: [image] })

            //delte image
            fs.unlinkSync(image)
        },
        generateRank,
        [],
        []
    )
}
