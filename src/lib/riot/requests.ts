import fetch from 'node-fetch'

class Requests {
    constructor() {}

    async makeRequest(url: string) {
        let request = await fetch(url, {
            method: 'GET',
            headers: {
                'X-Riot-Token': process.env.RIOT_TOKEN,
            },
        })

        try {
            let json = await request.json()

            return json
        } catch (_) {
            return null
        }
    }
}

export default Requests
