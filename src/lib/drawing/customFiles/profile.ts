import { userData } from '$/lib/Profile'
import { workerData } from 'worker_threads'
import { Drawing } from '../main'

async

const data = workerData as userData

const drawing = new Drawing('images/profile/background.png')

return drawing.toBuffer()
