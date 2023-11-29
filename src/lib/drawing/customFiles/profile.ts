import { userData } from '$/lib/Profile'
import { parentPort, workerData } from 'worker_threads'
import { Drawing } from '../main'

const main = async () => {
    const data = workerData as userData

    const drawing = new Drawing('images/profile/background.png')

    /*drawing.addLayer(
        await Layer.fromURL(getImageFile('profileicon/' + data.pfp), {
            x: 20,
            y: 20,
        }),
    )*/

    //make buffer
    const parent = parentPort

    if (!parent) {
        throw 'No parent found!'
    }

    //will be transfered as UInt8Array
    parent.postMessage(await drawing.toBuffer())
}

main().catch((err) => {
    console.log(err)
})
