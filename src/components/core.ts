import { ButtonInteraction, CommandInteraction } from 'discord.js'
import { generateProfile } from '../commands/profile'
import linkedAccounts from '../lib/nameHistory'
import Riot from '../lib/riot/core'
import accountPicker from './accountPicker'
import Logger from '../lib/logger'

export default async function handleInteraction(
    interaction: ButtonInteraction | CommandInteraction,
    username: string | null,
    region: string | null,
    bindFunction: string,
    calledFunction: Function,
    otherArguments: Array<any>
) {
    let l = new Logger('CORE', 'white')

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
            await generateProfile(accounts[0].username, accounts[0].region, interaction)
        } else {
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
                .bindFunction(bindFunction)
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

            //here call the main function
            l.start('Running calledFunction...')
            try {
                await calledFunction(userData.username, userData.region, data, riot, interaction, ...otherArguments)
            } catch (e) {
                l.stopError('Error while running calledFunction!')
                return
            }
            l.stop('calledFunction ran successfully!')
        } else {
            interaction.editReply('Nezadal jsi region, bude to chvíli trvat...')

            let accountData = await riot.findAccount(username)

            if (accountData.length > 1) {
                new accountPicker(accountData, interaction, true).bindFunction(bindFunction).send()
            } else {
                interaction.editReply({ content: 'Máme tvůj účet! Nyní získáváme data o něm...' })
                await generateProfile(accountData[0].name, accountData[0].region, interaction)
            }
        }
    }
}
