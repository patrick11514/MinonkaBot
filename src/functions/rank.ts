import { Rank } from '$/lib/Rank'
import { generateEvents } from '$/lib/utils'

export default {
    events: [generateEvents('rank', Rank.getUserProfileByPuuid)],
}
