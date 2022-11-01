import { ButtonInteraction, Client, CommandInteraction } from 'discord.js'
import accountPicker from '../components/accountPicker'
import Images from '../lib/images/core'
import linkedAccounts from '../lib/nameHistory'
import Riot from '../lib/riot/core'

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
    let userData: {
        username: string | null
        region: string | null
    } = {
        username: null,
        region: null,
    }

    if (!username) {
        let link = new linkedAccounts(interaction.user.id, interaction.client.usersDB, interaction.client.nameHistoryDB)
        let accounts = await link.getAccounts()
        if (accounts?.length == 0) {
            return interaction.editReply({
                content:
                    'Použil jsi tento příkaz bez argumentů a nemáš propojený žády účet. Bud použij příkaz `/link` nebo použij tento příkaz s argumenty.',
            })
        }

        if (accounts?.length == 1) {
            await generateRank(accounts[0].username, accounts[0].region, interaction)
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
                .bindFunction('rank')
                .send()
        }
    } else {
        let riot = new Riot()

        if (region) {
            userData.username = username
            userData.region = region

            let data = await riot.getSummonerByName(userData.username, userData.region)

            if (!data) {
                interaction.editReply({
                    content: 'Jméno :user nebylo nalezeno na serveru :region!'
                        .replace(':user', userData.username)
                        .replace(':region', userData.region),
                })

                return
            }

            let rankedData = await riot.getRankedData(data.id, userData.region)

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
        } else {
            interaction.editReply('Nezadal jsi region, bude to chvíli trvat...')

            let accountData = await riot.findAccount(username)

            if (accountData.length > 1) {
                new accountPicker(accountData, interaction, true).bindFunction('rank').send()
            } else {
                interaction.editReply({ content: 'Máme tvůj účet! Nyní získáváme data o něm...' })
                await generateRank(accountData[0].name, accountData[0].region, interaction)
            }
        }
    }
}
