import { Client, CommandInteraction } from 'discord.js'
import Images from '../lib/images/core'
import Logger from '../lib/logger'
import Riot from '../lib/riot/core'
import { UserChallenges } from '../types/riotApi'

export default (client: Client) => {
    let e = client.emitter
    let l = new Logger('Profile', 'cyan')

    e.on('command', async (interaction: CommandInteraction) => {
        if (interaction.commandName === 'profile') {
            let username = interaction.options.get('username', false)
            let region = interaction.options.get('region', false)

            generateProfile(username?.value as string, region?.value as string, interaction)
        }
    })

    async function generateProfile(
        username: string | null,
        region: string | null,
        interaction: CommandInteraction,
        reply = false
    ) {
        let userData: {
            username: string | null
            region: string | null
        } = {
            username: null,
            region: null,
        }

        if (!username) {
            //tbd
        } else {
            let riot = new Riot()

            if (region) {
                userData.username = username
                userData.region = region

                let data = await riot.getSummonerByName(userData.username, userData.region)

                if (!data) {
                    return interaction.reply({
                        content: 'Jméno :user nebylo nalezeno na serveru :region!'
                            .replace(':user', userData.username)
                            .replace(':region', userData.region),
                    })
                }

                let challenges = await riot.getChallenges(data.puuid, userData.region)

                if (!challenges) {
                    return interaction.reply({
                        content: 'Nepovedlo se načíst data z Riot API!',
                    })
                }

                if (!reply) await interaction.deferReply()

                let dataFor = {
                    username: data.name,
                    level: data.summonerLevel,
                    iconId: data.profileIconId,
                    title: challenges.preferences.title,
                    challenges: challenges.preferences.challengeIds?.map((id) => {
                        let challenge = (challenges as UserChallenges).challenges.find(
                            (chall) => chall.challengeId === id
                        )
                        if (!challenge) return { id: 0, tier: '' }

                        return {
                            id: id,
                            tier: challenge.level,
                        }
                    }),
                }

                let images = new Images()

                let image = await images.generateProfilePicture(dataFor)

                interaction.editReply({ content: '', files: [image] })
            } else {
                interaction.reply('Nezadal jsi region, bude to chvíli trvat...')

                let accountData = await riot.findAccount(username)

                if (accountData.length > 1) {
                    //account picker
                } else {
                    interaction.editReply({ content: 'Máme tvůj účet! Nyní získáváme data o něm...' })
                    await generateProfile(accountData[0].name, accountData[0].region, interaction, true)
                }
            }
        }
    }
}
