import accountPicker from '$components/accountPicker'
import linkedAccounts from '$lib/nameHistory'
import Riot from '$lib/riot/core'
import { FakeInteraction } from '$types/types'
import { ButtonInteraction, ChatInputCommandInteraction, Client, User } from 'discord.js'

export default (client: Client) => {
    let e = client.emitter

    e.on('command', async (interaction: ChatInputCommandInteraction) => {
        if (interaction.commandName === 'namehistory') {
            let username = interaction.options.getString('username', false)
            let region = interaction.options.getString('region', false)
            let mention = interaction.options.getUser('mention', false)

            nameHistory(username, region, mention, interaction)
        }
    })
}

export async function nameHistory(
    username: string | null,
    region: string | null,
    mention: User | null,
    interaction: ChatInputCommandInteraction | ButtonInteraction | FakeInteraction,
) {
    let userData: {
        username: string | null
        region: string | null
    } = {
        username: null,
        region: null,
    }

    if (!username) {
        let link = new linkedAccounts(
            mention?.id ? mention.id : interaction.user.id,
            interaction.client.usersDB,
            interaction.client.nameHistoryDB,
        )
        let accounts = await link.getAccounts()
        if (accounts?.length == 0) {
            return interaction.editReply({
                content:
                    'Použil jsi tento příkaz bez argumentů a nemáš propojený žády účet. Bud použij příkaz `/link` nebo použij tento příkaz s argumenty.',
            })
        }

        if (accounts?.length == 1) {
            await nameHistory(accounts[0].username, accounts[0].region, null, interaction)
        } else {
            new accountPicker(
                accounts.map((account) => {
                    return {
                        name: account.username,
                        region: account.region,
                        level: -1,
                    }
                }),
                interaction,
                true,
            )
                .bindFunction('profile')
                .send()
        }
    } else {
        if (region) {
            userData.username = username
            userData.region = region

            let data = await Riot.getSummonerByName(userData.username, userData.region)

            if (!data) {
                interaction.editReply({
                    content: 'Jméno :user nebylo nalezeno na serveru :region!'
                        .replace(':user', userData.username)
                        .replace(':region', userData.region),
                })

                return
            }

            let content = `**Historie jmen účtu ${data.name} na regionu ${interaction.client.config.regionTranslates[region]}**:`
            content += '\n*Od nejnovějšího k nejstaršímu*\n'

            let link = new linkedAccounts(
                interaction.user.id,
                interaction.client.usersDB,
                interaction.client.nameHistoryDB,
            )

            let accounts = await link.getAccountHistory(data.id, data.name, region)

            content += ['', `**${accounts.pop()}** (aktuální)`, ...accounts.reverse()].join('\n* ')

            interaction.editReply({ content: content })
        } else {
            interaction.editReply('Nezadal jsi region, bude to chvíli trvat...')

            let accountData = await Riot.findAccount(username)

            if (accountData.length > 1) {
                new accountPicker(accountData, interaction, true).bindFunction('nameHistory').send()
            } else {
                interaction.editReply({ content: 'Máme tvůj účet! Nyní získáváme data o něm...' })
                await nameHistory(accountData[0].name, accountData[0].region, null, interaction)
            }
        }
    }
}
