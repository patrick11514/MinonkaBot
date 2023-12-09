import { userData } from '$/lib/Rank'
import { colorList, getImageFile, tierColors } from '$/lib/utils'
import { WorkerLolData } from '$/types/types'
import { isMainThread, parentPort, workerData } from 'node:worker_threads'
import { Layer } from '../layer'
import { Drawing } from '../main'
import { Text } from '../text'

const main = async () => {
    const { data, version } = workerData as WorkerLolData<userData>
    process.LOL_VERSION = version

    //background
    const drawing = new Drawing('images/rank/background.png')
    await drawing.getMetadata()

    //left side
    const profileSpacing = 200
    const leftSpacing = 250
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
        x: (profileImage.width - levelBackground.width) / 2,
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
    leftSide.addLayer(levelBackground)

    //region
    const region = new Text({
        text: data.region,
        fontSize: 50,
        position: {
            x: 0,
            y: levelBackground.position.y - 60 - spacing,
        },
        size: {
            height: 60,
            width: profileImage.width,
        },
    })
    leftSide.addLayer(region)

    //username
    const username = new Text({
        text: data.username,
        fontSize: 80,
        position: {
            x: 0,
            y: profileImage.position.y + profileImage.height + spacing,
        },
        size: {
            height: 80,
            width: leftSpacing * 2 + profileImage.width,
        },
        color: '#eae1cf',
    })
    drawing.addLayer(username)
    drawing.addLayer(leftSide)

    let rankY = 0
    const rankPercentage = 50
    //ranks
    data.ranks.sort((a, _) => {
        return a.queueType == 'RANKED_SOLO_5x5' ? -1 : 1
    })

    const layerSpacingX = 60
    const layerSpacingY = 50

    for (const rank of data.ranks) {
        if (rank.tier === undefined || rank.rank === undefined) continue

        const rankLayer = Layer.createEmpty(
            {
                width: Math.round((drawing.width * rankPercentage) / 100) - layerSpacingX * 2,
                height: Math.round(drawing.height / 2) - layerSpacingY * 2,
            },
            {
                x: drawing.width - Math.round((drawing.width * rankPercentage) / 100) - layerSpacingX,
                y: rankY + layerSpacingY,
            },
        )

        await rankLayer.getMetadata()

        //queue name
        const queueTextHeight = 70
        const queueName = new Text({
            text: rank.queueType === 'RANKED_SOLO_5x5' ? 'Solo/Duo' : 'Flex',
            fontSize: 55,
            position: {
                x: 0,
                y: 0,
            },
            size: {
                height: queueTextHeight,
                width: rankLayer.width,
            },
        })
        rankLayer.addLayer(queueName)
        const downLayer = Layer.createEmpty(
            {
                width: rankLayer.width,
                height: rankLayer.height - queueTextHeight,
            },
            {
                x: 0,
                y: queueTextHeight,
            },
        )
        await downLayer.getMetadata()

        //tier icon
        const tierIcon = new Layer('images/ranks/' + rank.tier.toLowerCase() + '.png')
        await tierIcon.getMetadata()
        await tierIcon.resize(rankLayer.height - queueTextHeight)
        tierIcon.setPosition({
            x: 0,
            y: 0,
        })

        downLayer.addLayer(tierIcon)

        const textSpacing = 50

        //tier name
        const tierName = new Text({
            text:
                rank.tier
                    .split('')
                    .map((c, i) => (i != 0 ? c.toLowerCase() : c))
                    .join('') + //all lowercase except first letter
                ' ' +
                rank.rank,
            fontSize: 60,
            position: {
                x: tierIcon.width,
                y: textSpacing,
            },
            align: 'left',
            size: {
                height: 60,
                width: downLayer.width - tierIcon.width,
            },
            color: tierColors(rank.tier),
        })
        downLayer.addLayer(tierName)

        //winrate
        const winrate = Math.round((rank.wins / (rank.wins + rank.losses)) * 100)
        const winRate = new Text({
            text: winrate.toPrecision(2) + '%',
            fontSize: 60,
            position: {
                x: tierIcon.width,
                y: textSpacing,
            },
            align: 'right',
            size: {
                height: 55,
                width: downLayer.width - tierIcon.width - textSpacing,
            },
            color: winrate >= 50 ? colorList.GREEN : colorList.RED,
        })
        downLayer.addLayer(winRate)

        //LP
        const LP = new Text({
            text: rank.leaguePoints.toString() + ' LP',
            fontSize: 60,
            position: {
                x: tierIcon.width,
                y: downLayer.height - textSpacing - 60,
            },
            align: 'left',
            size: {
                height: 60,
                width: downLayer.width - tierIcon.width,
            },
        })
        downLayer.addLayer(LP)

        //wins
        const wins = new Text({
            text: rank.wins.toString() + ' Wins',
            fontSize: 60,
            position: {
                x: tierIcon.width,
                y: downLayer.height - textSpacing - 60,
            },
            align: 'center',
            size: {
                height: 60,
                width: downLayer.width - tierIcon.width - textSpacing * 4,
            },
            color: colorList.GREEN,
        })
        downLayer.addLayer(wins)

        //losses
        const losses = new Text({
            text: rank.losses.toString() + ' Losses',
            fontSize: 60,
            position: {
                x: tierIcon.width,
                y: downLayer.height - textSpacing - 60,
            },
            align: 'right',
            size: {
                height: 60,
                width: downLayer.width - tierIcon.width - textSpacing,
            },
            color: colorList.RED,
        })
        downLayer.addLayer(losses)

        rankLayer.addLayer(downLayer)

        rankY += drawing.height / 2

        drawing.addLayer(rankLayer)
    }

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
