import { RankedData } from './riotApi'

interface user {
    puuid: string
    region: string
    data: Array<RankedData>
}

export default user
