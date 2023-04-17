import EventEmitter from 'events'
import JSONdb from 'simple-json-db'
import Config from './config'
import { LiveRank } from '$lib/riot/workers/liveRank'

declare module 'discord.js' {
    export interface Client {
        emitter: EventEmitter
        LOL_VERSION: string
        config: Config
        usersDB: JSONdb
        nameHistoryDB: JSONdb
        emotesDB: JSONdb
        commandsDB: JSONdb
        LPDB: JSONdb
        LRDB: JSONdb
        liveRank: LiveRank
    }
}
