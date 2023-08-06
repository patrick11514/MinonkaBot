import { errorResponse } from '$types/riotApi'
import fetch from 'node-fetch'
import Logger from '../logger'

class Requests {
    l: Logger
    constructor(logger: Logger) {
        this.l = logger
    }

    async makeRequest<T>(url: string): Promise<T | errorResponse | null> {
        try {
            let request = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-Riot-Token': process.env.RIOT_TOKEN,
                },
            })

            let json = (await request.json()) as T | errorResponse

            return json
        } catch (e) {
            this.l.error(e)
            return null
        }
    }
}

export default Requests
