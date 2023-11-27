import { DiscordEvent } from '$/hooks'
import { Link } from '$/lib/Link'

const events: DiscordEvent<any>[] = []
const link = new Link()

export default {
    events,
}

/**
 *
 * /link
 *
 */
events.push(
    new DiscordEvent('interactionCreate', async (interaction) => {
        if (!interaction.isChatInputCommand()) return
        if (interaction.commandName !== 'link') return

        link.handleCommand(interaction)
    }),
)
/**
 *
 * MODAL
 *
 */
events.push(
    new DiscordEvent('interactionCreate', async (interaction) => {
        if (!interaction.isStringSelectMenu()) return
        if (interaction.customId != '#LOL_LINK_TYPE') return

        link.sendModal(interaction)
    }),
)
/**
 *
 * Modal
 *
 */
events.push(
    new DiscordEvent('interactionCreate', async (interaction) => {
        if (!interaction.isModalSubmit()) return
        if (!interaction.customId.startsWith('#LOL_LINK_MODAL_')) return

        link.handleModal(interaction)
    }),
)

/**
 *
 * Select region
 *
 */
events.push(
    new DiscordEvent('interactionCreate', async (interaction) => {
        if (!interaction.isStringSelectMenu()) return
        if (interaction.customId != '#LOL_LINK_ADDITIONAL') return

        link.performLink(interaction)
    }),
)

/**
 *
 * Manage accounts buttons
 *
 */

events.push(
    new DiscordEvent('interactionCreate', async (interaction) => {
        if (!interaction.isButton()) return
        if (!['#LOL_LINK_ADD_ACCOUNT', '#LOL_LINK_REMOVE_ACCOUNT'].includes(interaction.customId)) return

        if (interaction.customId == '#LOL_LINK_ADD_ACCOUNT') {
            link.startLinking(interaction)
        } else {
            link.removeAccount(interaction)
        }
    }),
)

/**
 *
 * Remove account select
 *
 */
events.push(
    new DiscordEvent('interactionCreate', async (interaction) => {
        if (!interaction.isStringSelectMenu()) return
        if (interaction.customId != '#LOL_LINK_REMOVE_ACCOUNT_SELECT') return

        link.removeAccountSelect(interaction)
    }),
)
