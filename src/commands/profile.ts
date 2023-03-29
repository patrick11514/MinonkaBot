import { ButtonInteraction, Client, CommandInteraction, User } from 'discord.js'
import handleInteraction from '../components/core'
import Images from '../lib/images/core'
import Riot from '../lib/riot/core'
import { SummonerBy, UserChallenges } from '../types/riotApi'
import DBUser from '../types/usersDB'
import fs from 'fs'

export default (client: Client) => {
    let e = client.emitter

    e.on('command', async (interaction: CommandInteraction) => {
        if (interaction.commandName === 'profile') {
            let username = interaction.options.get('username', false)
            let region = interaction.options.get('region', false)
            let mention = interaction.options.getUser('mention', false)

            generateProfile(username?.value as string, region?.value as string, mention, interaction)
        }
    })
}

export async function generateProfile(
    username: string | null,
    region: string | null,
    mention: User | null,
    interaction: CommandInteraction | ButtonInteraction
) {
    handleInteraction(
        interaction,
        username,
        region,
        mention,
        'profile',
        async function (
            username: string,
            region: string,
            data: SummonerBy,
            interaction: CommandInteraction | ButtonInteraction
        ) {
            let challenges = await Riot.getChallenges(data.puuid, region)

            if (!challenges) {
                interaction.editReply({ content: 'Nepovedlo se načíst data z Riot API!' })

                return
            }

            let dataFor = {
                username: data.name,
                level: data.summonerLevel,
                iconId: data.profileIconId,
                title: challenges.preferences.title,
                challenges: challenges.preferences.challengeIds?.map((id) => {
                    let challenge = (challenges as UserChallenges).challenges.find((chall) => chall.challengeId === id)
                    if (!challenge) return { id: 0, tier: '' }

                    return {
                        id: id,
                        tier: challenge.level,
                    }
                }),
            }

            //get user language
            let db = interaction.client.usersDB
            let language = 'cs_CZ'
            if (db.has(interaction.user.id)) {
                let data: DBUser = await db.get(interaction.user.id)
                if (data.language) {
                    language = data.language
                }
            }

            let images = new Images()

            let image = await images.generateProfilePicture(dataFor, language)

            await interaction.editReply({ content: '', files: [image] })

            //delete generated image
            fs.unlinkSync(image)
        },
        generateProfile,
        [],
        []
    )
}
