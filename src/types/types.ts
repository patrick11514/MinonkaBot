import JSONdb from 'simple-json-db'
import Config from './config'

export type ClashAction = 'schedule'

export type FakeInteractionArg =
    | string
    | {
          content: string
          components?: any[]
      }
export interface FakeInteraction {
    editReply: (content: FakeInteractionArg) => void
    reply: (content: FakeInteractionArg) => void
    client: {
        usersDB: JSONdb
        nameHistoryDB: JSONdb
        commandsDB: JSONdb
        config: Config
        LPDB: JSONdb
    }
    user: {
        id: string
        name: string
    }
    fake: true
}
