import { regionTranslates } from '$/data/translates'
import { userData } from '$/lib/Profile'
import { getImageFile, getStaticImageFile } from '$/lib/utils'
import { WorkerLolData } from '$/types/types'
import { isMainThread, parentPort, workerData } from 'worker_threads'
import { Layer } from '../layer'
import { Drawing } from '../main'
import { Text } from '../text'

const main = async () => {
    const { data, version } = workerData as WorkerLolData<userData>
    process.LOL_VERSION = version

    //background
    const drawing = new Drawing('images/profile/background.png')
    await drawing.getMetadata()

    //profile image
    const profileImage = await Layer.fromURL(getImageFile('profileicon/' + data.pfp), {
        x: 120,
        y: 400,
    })
    await profileImage.getMetadata()
    await profileImage.resize(drawing.width - 2 * 120)
    drawing.addLayer(profileImage)

    //level
    const level = new Layer('images/profile/level.png')
    await level.getMetadata()
    level.setPosition({
        x: (drawing.width - level.width) / 2,
        y: 200,
    })
    drawing.addLayer(level)

    const levelText = new Text({
        text: data.level.toString(),
        fontSize: 60,
        position: {
            x: 0,
            y: 0,
        },
        size: {
            height: level.height,
            width: level.width,
        },
    })
    level.addLayer(levelText)

    //region
    const regionText = new Text({
        text: regionTranslates[data.region],
        fontSize: 60,
        position: {
            x: (drawing.width - level.width) / 2,
            y: level.position.y - level.height,
        },
        size: {
            height: level.height,
            width: level.width,
        },
    })
    drawing.addLayer(regionText)

    //playername
    const userName = new Text({
        text: data.username,
        color: '#eae1cf',
        fontSize: 80,
        position: {
            x: 0,
            y: profileImage.position.y + profileImage.height + /*spacing */ 50,
        },
        size: {
            width: drawing.width,
            height: 80,
        },
    })
    drawing.addLayer(userName)

    //title
    const title = new Text({
        text: data.title,
        color: '#9c9688',
        fontSize: 50,
        position: {
            x: 0,
            y: userName.position.y + userName.size.height,
        },
        size: {
            width: drawing.width,
            height: 80,
        },
        bold: false,
    })
    drawing.addLayer(title)

    //challenges
    const challSpacing = 20
    const challSize = 150
    const boxStart = {
        x: (drawing.width - (challSize * 3 + challSpacing * 2)) / 2,
        y: title.position.y + 150,
    }

    const boxWidth = challSize * 3 + challSpacing * 2
    const chCount = data.challenges?.length
    let lastX = boxStart.x + (boxWidth - (chCount * challSize + (chCount - 1) * challSpacing)) / 2

    if (chCount > 0) {
        for (const challengeData of data.challenges) {
            const challenge = await Layer.fromURL(
                getStaticImageFile(`challenges-images/${challengeData.id}-${challengeData.tier}`),
            )

            challenge
                .setPosition({
                    x: lastX,
                    y: boxStart.y,
                })
                .resize(challSize)

            lastX += challSize + challSpacing
            drawing.addLayer(challenge)
        }
    }

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
