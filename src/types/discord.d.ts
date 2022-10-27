import EventEmitter from 'events'
import JSONdb from 'simple-json-db'
import Config from './config'

declare module 'discord.js' {
    export interface Client {
        emitter: EventEmitter
        LOL_VERSION: string
        config: Config
        usersDB: JSONdb
        nameHistoryDB: JSONdb
    }
}
