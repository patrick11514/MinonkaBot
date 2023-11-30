import { userData } from '$/lib/Profile'
import { getImageFile } from '$/lib/utils'
import { WorkerLolData } from '$/types/types'
import { isMainThread, parentPort, workerData } from 'worker_threads'
import { Layer } from '../layer'
import { Drawing } from '../main'

const main = async () => {
    const { data, version } = workerData as WorkerLolData<userData>
    process.LOL_VERSION = version

    console.log('a')

    //background
    const drawing = new Drawing('images/profile/background.png')
    await drawing.getMetadata()

    //profile image
    const profileImage = await Layer.fromURL(getImageFile('profileicon/' + data.pfp), {
        x: 120,
        y: 400,
    })
    profileImage.resize((drawing.width as number) - 2 * 120)
    drawing.addLayer(profileImage)

    //level
    const level = new Layer('images/profile/level.png', {
        x: ((drawing.width as number) - 222) / 2,
        y: 40,
    })
    await level.getMetadata()
    drawing.addLayer(level)

    //make buffer
    const parent = parentPort

    if (!parent) {
        throw 'No parent found!'
    }

    //will be transfered as UInt8Array
    parent.postMessage(await drawing.toBuffer())
}

if (!isMainThread) {
    main().catch((err) => {
        throw err
    })
}
