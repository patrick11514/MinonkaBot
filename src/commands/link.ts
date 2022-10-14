import { ButtonInteraction, Client, CommandInteraction } from 'discord.js'
import accountPicker from '../components/accountPicker'
import Logger from '../lib/logger'
import linkedAccounts from '../lib/nameHistory'
import Riot from '../lib/riot/core'

export default (client: Client) => {
    let e = client.emitter
    let l = new Logger('Link', 'cyanBright')

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
    let riot = new Riot()

    let linking = new linkedAccounts(interaction.user.id, interaction.client.usersDB)

    if (action == 'list') {
        let accounts = await linking.getAccounts()
        if (accounts?.length > 0) {
            let text = '**Propojené účty:**\n'
            accounts.forEach((account) => {
                text += `${account.username} na regionu ${interaction.client.config.regionTranslates[account.region]}\n`
            })

            return interaction.reply({
                content: text,
            })
        } else {
            interaction.reply({
                content: 'Nemáš propojený žádný účet.',
            })
        }
    } else if (action == 'add') {
        if (username) {
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

                if (edit) await interaction.deferReply()

                let accounts = await linking.getAccounts()

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
                interaction.reply('Nezadal jsi region, bude to chvíli trvat...')

                let accountData = await riot.findAccount(username)

                if (accountData.length > 1) {
                    new accountPicker(accountData, interaction, true).bindFunction('link', action).send()
                } else {
                    interaction.editReply({ content: 'Máme tvůj účet! Nyní získáváme data o něm...' })
                    await link(action, accountData[0].name, accountData[0].region, interaction, false)
                }
            }
        } else {
            interaction.reply({
                content: 'Nevyplnil jsi žádné jméno',
            })
        }
    } else if (action == 'delete') {
        if (!username) {
            return interaction.reply({
                content: 'Nezadal jsi žádné jméno účtu!',
            })
        }
        let accounts = await linking.getAccounts()
        if (!region) {
            let find = accounts.filter((account) => account.username == username)
            if (find.length > 1) {
                return interaction.reply({
                    content: 'Máš propojeno více účtů s tímto jménem, zadej prosím i region.',
                })
            }
            await linking.removeAccount(find[0].id)
            return interaction.reply({
                content: 'Účet byl úspěšně odpojen!',
            })
        }
        let account = accounts.find((account) => account.username == username && account.region == region)

        if (!account) {
            return interaction.reply({
                content: 'Žádný tvůj účet s tímto jménem a regionem nebyl nalezen!',
            })
        }

        await linking.removeAccount(account.id)

        interaction.reply({
            content: 'Účet byl úspěšně odpojen!',
        })
    } else {
        interaction.reply('Nevyplnil jsi žádnou akci.')
    }
}
