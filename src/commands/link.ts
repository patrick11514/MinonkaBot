import { ButtonInteraction, Client, CommandInteraction } from 'discord.js'
import accountPicker from '../components/accountPicker'
import linkedAccounts from '../lib/nameHistory'
import Riot from '../lib/riot/core'

export default (client: Client) => {
    let e = client.emitter

    e.on('command', async (interaction: CommandInteraction) => {
        if (interaction.commandName === 'link') {
            let action = interaction.options.get('action', true)
            let username = interaction.options.get('username', false)
            let region = interaction.options.get('region', false)

            link(action.value as string, username?.value as string, region?.value as string, interaction)
        }
    })
}

export async function link(
    action: string,
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

    let linking = new linkedAccounts(interaction.user.id, interaction.client.usersDB, interaction.client.nameHistoryDB)

    if (action == 'list') {
        let accounts = await linking.getAccounts()
        if (accounts.length > 0) {
            let text = '**Propojené účty:**\n'
            accounts.forEach((account) => {
                text += `${account.username} na regionu ${interaction.client.config.regionTranslates[account.region]}\n`
            })

            return interaction.editReply({
                content: text,
            })
        } else {
            interaction.editReply({
                content: 'Nemáš propojený žádný účet.',
            })
        }
    } else if (action == 'add') {
        if (username) {
            if (region) {
                let accounts = await linking.getAccounts()

                if (accounts.length == 5 * 5) {
                    interaction.editReply({
                        content: 'Máš propojeno již 25 účtů, což je maximum. Pro přidání jiného účtu nějaký odeber.',
                    })
                    return
                }

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

                let find = accounts.find((account) => account.id == data?.id)

                if (find) {
                    return interaction.editReply({
                        content: 'Již máš tento účet propojený.',
                    })
                }

                let success = await linking.addAccount(data.name, data.id, userData.region)

                if (success) {
                    interaction.editReply({
                        content:
                            'Tvůj účet ' +
                            data.name +
                            ' na regionu ' +
                            interaction.client.config.regionTranslates[userData.region] +
                            ' byl úspěšně propojen!',
                    })
                } else {
                    interaction.editReply({
                        content: 'Tvůj účet se nepovedlo propojit.',
                    })
                }
            } else {
                interaction.editReply('Nezadal jsi region, bude to chvíli trvat...')

                let accountData = await Riot.findAccount(username)

                if (accountData.length > 1) {
                    new accountPicker(accountData, interaction, true).bindFunction('link', action).send()
                } else {
                    interaction.editReply({ content: 'Máme tvůj účet! Nyní získáváme data o něm...' })
                    await link(action, accountData[0].name, accountData[0].region, interaction)
                }
            }
        } else {
            interaction.editReply({
                content: 'Nevyplnil jsi žádné jméno',
            })
        }
    } else if (action == 'delete') {
        let accounts = await linking.getAccounts()
        if (accounts.length == 0) {
            return interaction.editReply({
                content: 'Nemáš propojený žádný účet.',
            })
        }

        if (!username) {
            new accountPicker(
                accounts.map((account) => {
                    return {
                        name: account.username,
                        region: account.region,
                        level: -1,
                    }
                }),
                interaction,
                true
            )
                .bindFunction('link', action)
                .send()
            return
        }

        if (!region) {
            let find = accounts.filter((account) => account.username.toLowerCase() == username.toLowerCase())
            if (find.length > 1) {
                return interaction.editReply({
                    content: 'Máš propojeno více účtů s tímto jménem, zadej prosím i region.',
                })
            } else if (!find) {
                return interaction.editReply({
                    content: 'Nepovedlo se najít účet s tímto jménem!',
                })
            }
            await linking.removeAccount(find[0].id)
            return interaction.editReply({
                content: 'Účet byl úspěšně odpojen!',
            })
        }
        let account = accounts.find((account) => account.username == username && account.region == region)

        if (!account) {
            return interaction.editReply({
                content: 'Žádný tvůj účet s tímto jménem a regionem nebyl nalezen!',
            })
        }

        await linking.removeAccount(account.id)

        interaction.editReply({
            content: 'Účet byl úspěšně odpojen!',
        })
    } else {
        interaction.editReply('Nevyplnil jsi žádnou akci.')
    }
}
