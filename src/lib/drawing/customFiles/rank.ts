import { userData } from '$/lib/Rank'
import { getImageFile } from '$/lib/utils'
import { WorkerLolData } from '$/types/types'
import { isMainThread, parentPort, workerData } from 'node:worker_threads'
import { Layer } from '../layer'
import { Drawing } from '../main'
import { Text } from '../text'

const main = async () => {
    const { data, version } = workerData as WorkerLolData<userData>
    process.LOL_VERSION = version

    console.log(data)

    //background
    const drawing = new Drawing('images/rank/background.png')
    await drawing.getMetadata()

    //left side
    const profileSpacing = 200
    const leftSpacing = 120
    const imageWidth = drawing.height - 2 * profileSpacing

    const leftSide = Layer.createEmpty(
        {
            width: imageWidth,
            height: drawing.height,
        },
        {
            x: leftSpacing,
            y: 0,
        },
    )
    await leftSide.getMetadata()

    //profile image
    const profileImage = await Layer.fromURL(getImageFile('profileicon/' + data.pfp), {
        x: 0,
        y: profileSpacing,
    })
    await profileImage.getMetadata()
    await profileImage.resize(drawing.height - 2 * profileSpacing)
    leftSide.addLayer(profileImage)

    //level
    const spacing = 10

    const levelBackground = new Layer('images/profile/level.png')
    await levelBackground.getMetadata()
    levelBackground.setPosition({
        x: leftSpacing + (profileImage.width - levelBackground.width) / 2,
        y: profileImage.position.y - levelBackground.height - spacing,
    })

    //level text
    const levelText = new Text({
        text: data.level.toString(),
        fontSize: 60,
        position: {
            x: 0,
            y: 0,
        },
        size: {
            height: levelBackground.height,
            width: levelBackground.width,
        },
    })

    levelBackground.addLayer(levelText)
    drawing.addLayer(levelBackground)

    //region
    const region = new Text({
        text: data.region,
        fontSize: 50,
        position: {
            x: leftSpacing,
            y: levelBackground.position.y - 60 - spacing,
        },
        size: {
            height: 60,
            width: profileImage.width,
        },
    })
    drawing.addLayer(region)

    //username
    const username = new Text({
        text: data.username,
        fontSize: 80,
        position: {
            x: leftSpacing,
            y: profileImage.position.y + profileImage.height + spacing,
        },
        size: {
            height: 80,
            width: profileImage.width,
        },
        color: '#eae1cf',
    })
    drawing.addLayer(username)
    drawing.addLayer(leftSide)

    let rankY = 0
    const rankPercentage = 70
    //ranks
    data.ranks
        .sort((a, _) => {
            return a.queueType == 'RANKED_SOLO_5x5' ? -1 : 1
        })
        .forEach((rank) => {
            const rankLayer = Layer.createEmpty(
                {
                    width: Math.round((drawing.width * rankPercentage) / 100),
                    height: Math.round(drawing.height / 2),
                },
                {
                    x: drawing.width - Math.round((drawing.width * rankPercentage) / 100),
                    y: rankY,
                },
            )

            rankY += drawing.height / 2

            drawing.addLayer(rankLayer)
        })

    //make buffer
    const parent = parentPort

    if (!parent) {
        throw 'No parent found!'
    }

    parent.postMessage(await drawing.toBuffer())
}

if (!isMainThread) {
    main().catch((err) => {
        throw err
    })
}
