import { ButtonInteraction, Client, CommandInteraction } from 'discord.js'
import accountPicker from '../components/accountPicker'
import Images from '../lib/images/core'
import Logger from '../lib/logger'
import linkedAccounts from '../lib/nameHistory'
import Riot from '../lib/riot/core'
import { UserChallenges } from '../types/riotApi'
import User from '../types/usersDB'

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
}

export async function generateProfile(
    username: string | null,
    region: string | null,
    interaction: CommandInteraction | ButtonInteraction,
    edit = true
) {
    let userData: {
        username: string | null
        region: string | null
    } = {
        username: null,
        region: null,
    }

    if (!username) {
        let link = new linkedAccounts(interaction.user.id, interaction.client.usersDB)
        let accounts = await link.getAccounts()
        if (accounts?.length == 0) {
            return interaction.reply({
                content:
                    'Použil jsi tento příkaz bez argumentů a nemáš propojený žády účet. Bud použij příkaz `/link` nebo použij tento příkaz s argumenty.',
            })
        }

        if (accounts?.length == 1) {
            await generateProfile(accounts[0].username, accounts[0].region, interaction)
        } else {
            await interaction.deferReply()
            new accountPicker(
                accounts.map((account) => {
                    return {
                        name: account.username,
                        region: account.region,
                    }
                }),
                interaction,
                true
            )
                .bindFunction('profile')
                .send()
        }
    } else {
        let riot = new Riot()

        if (region) {
            userData.username = username
            userData.region = region

            let data = await riot.getSummonerByName(userData.username, userData.region)

            if (!data) {
                if (edit) {
                    interaction.editReply({
                        content: 'Jméno :user nebylo nalezeno na serveru :region!'
                            .replace(':user', userData.username)
                            .replace(':region', userData.region),
                    })
                } else {
                    interaction.reply({
                        content: 'Jméno :user nebylo nalezeno na serveru :region!'
                            .replace(':user', userData.username)
                            .replace(':region', userData.region),
                    })
                }
                return
            }

            let challenges = await riot.getChallenges(data.puuid, userData.region)

            if (!challenges) {
                if (edit) {
                    interaction.editReply({ content: 'Nepovedlo se načíst data z Riot API!' })
                } else {
                    interaction.reply({
                        content: 'Nepovedlo se načíst data z Riot API!',
                    })
                }
                return
            }

            if (edit) await interaction.deferReply()

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

            let images = new Images()

            let image = await images.generateProfilePicture(dataFor, language)

            interaction.editReply({ content: '', files: [image] })
        } else {
            interaction.reply('Nezadal jsi region, bude to chvíli trvat...')

            let accountData = await riot.findAccount(username)

            if (accountData.length > 1) {
                new accountPicker(accountData, interaction, true).bindFunction('profile').send()
            } else {
                interaction.editReply({ content: 'Máme tvůj účet! Nyní získáváme data o něm...' })
                await generateProfile(accountData[0].name, accountData[0].region, interaction, false)
            }
        }
    }
}
