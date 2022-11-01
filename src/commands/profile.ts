import { ButtonInteraction, Client, CommandInteraction } from 'discord.js'
import accountPicker from '../components/accountPicker'
import handleInteraction from '../components/core'
import Images from '../lib/images/core'
import linkedAccounts from '../lib/nameHistory'
import Riot from '../lib/riot/core'
import { SummonerBy, UserChallenges } from '../types/riotApi'
import User from '../types/usersDB'

export default (client: Client) => {
    let e = client.emitter

    e.on('command', async (interaction: CommandInteraction) => {
        if (interaction.commandName === 'profile') {
            let username = interaction.options.get('username', false)
            let region = interaction.options.get('region', false)

            generateProfile(username?.value as string, region?.value as string, interaction)
        }
    })
}

export async function generateProfile(
    username: string | null,
    region: string | null,
    interaction: CommandInteraction | ButtonInteraction
) {
    handleInteraction(
        interaction,
        username,
        region,
        'profile',
        async function (
            username: string,
            region: string,
            data: SummonerBy,
            riot: Riot,
            interaction: CommandInteraction | ButtonInteraction
        ) {
            let challenges = await riot.getChallenges(data.puuid, region)

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
            if (await db.has(interaction.user.id)) {
                let data: User = await db.get(interaction.user.id)
                if (data.language) {
                    language = data.language
                }
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

            let images = new Images()

            let image = await images.generateProfilePicture(dataFor, language)

            interaction.editReply({ content: '', files: [image] })
        },
        []
    )
}
