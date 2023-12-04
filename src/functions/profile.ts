import { Profile } from '$/lib/Profile'
import { generateEvents } from '$/lib/utils'
export default {
    events: [generateEvents('profile', Profile.getUserProfileByPuuid)],
}
