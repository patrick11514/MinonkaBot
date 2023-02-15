import { ButtonInteraction, CommandInteraction, DiscordAPIError, User } from 'discord.js'
import linkedAccounts from '../lib/nameHistory'
import Riot from '../lib/riot/core'
import accountPicker from './accountPicker'
import Logger from '../lib/logger'
import NameHistory from '../types/nameHistoryDB'
import utilities from '../lib/riot/utilities'

export default async function handleInteraction(
    interaction: ButtonInteraction | CommandInteraction,
    username: string | null,
    region: string | null,
    mention: User | null,
    bindFunction: string,
    calledFunction: Function,
    selfFunction: Function,
    otherArguments: Array<any>,
    argumentsForBindFunction: Array<any>
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
        let link = new linkedAccounts(
            mention?.id ? mention.id : interaction.user.id,
            interaction.client.usersDB,
            interaction.client.nameHistoryDB
        )
        let accounts = await link.getAccounts()
        if (accounts?.length == 0) {
            if (mention?.id) {
                return interaction.editReply({
                    content:
                        'Tento uživatel nemá žádný propojený účet přes příkaz ' +
                        utilities.mentionCommand('link', interaction.client),
                })
            } else {
                return interaction.editReply({
                    content:
                        'Použil jsi tento příkaz bez argumentů a nemáš propojený žády účet. Bud použij příkaz ' +
                        utilities.mentionCommand('link', interaction.client) +
                        ' nebo použij tento příkaz s argumenty.',
                })
            }
        }

        if (accounts?.length == 1) {
            await selfFunction(accounts[0].username, accounts[0].region, mention, interaction, ...otherArguments)
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
                true
            )
                .bindFunction(bindFunction, argumentsForBindFunction)
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

            //save check history of account
            let accounts = new linkedAccounts(
                mention?.id ? mention.id : interaction.user.id,
                interaction.client.usersDB,
                interaction.client.nameHistoryDB
            )

            if (interaction.client.nameHistoryDB.has(data.id)) {
                let accountInfo = interaction.client.nameHistoryDB.get(data.id) as NameHistory
                accounts.checkHistory([
                    {
                        username: accountInfo.username,
                        id: data.id,
                        region: region,
                    },
                ])
            } else {
                accounts.checkHistory([
                    {
                        username: data.name,
                        id: data.id,
                        region: region,
                    },
                ])
            }

            //here call the main function
            l.start('Running calledFunction...')
            try {
                await calledFunction(userData.username, userData.region, data, riot, interaction, ...otherArguments)
            } catch (e:
                | {
                      name: string
                      constraint: string
                      given: string
                      expected: string
                  }
                | any) {
                if (typeof e == 'object') {
                    let trace = e as {
                        errors: Array<{
                            name: string
                            validator?: string
                            constraint?: string
                            given: string
                            expected: string
                        }>
                    }

                    if (trace.errors?.length > 1) {
                        l.stopError(`Errors while running calledFunction `)
                        let i = 1
                        for (let error of trace.errors) {
                            l.error(i + '. ' + error)
                            i++
                        }
                    } else {
                        l.stopError(`Error while running calledFunction (${trace})`)
                    }
                } else {
                    l.stopError(`Error while running calledFunction (${e})!`)
                }
                return
            }
            l.stop('calledFunction ran successfully!')
        } else {
            interaction.editReply('Nezadal jsi region, bude to chvíli trvat...')

            let accountData = await riot.findAccount(username)

            if (accountData.length == 0) {
                interaction.editReply({
                    content: 'Účet s tímto jménem nebyl nalezen na žádném serveru. Zkus to znovu.',
                })
                return
            }

            if (accountData.length > 1) {
                new accountPicker(accountData, interaction, true)
                    .bindFunction(bindFunction, argumentsForBindFunction)
                    .send()
            } else {
                interaction.editReply({ content: 'Máme tvůj účet! Nyní získáváme data o něm...' })
                await selfFunction(accountData[0].name, accountData[0].region, interaction, ...otherArguments)
            }
        }
    }
}
