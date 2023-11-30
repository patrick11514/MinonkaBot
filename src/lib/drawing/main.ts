import Sharp from 'sharp'
import { checkCache, getCachePath, saveToCache, toFileName } from '../cache'
import { Layer } from './layer'

export type position = {
    x: number
    y: number
}

/**
 * Drawing class for creating images with Layers
 */
export class Drawing extends Layer {
    /**
     * Constructor
     * @param background path to file or Sharp object
     */
    constructor(background: string | Sharp.Sharp) {
        super(background, {
            x: 0,
            y: 0,
        })
    }

    /**
     * Generate Drawing from url
     * @param url Url to image
     * @param position Can be ignored
     * @param cache Cache file?
     * @returns Drawing object
     */
    static override async fromURL(url: string, position?: position, cache = true): Promise<Drawing> {
        if (!url.endsWith('.png') && !url.endsWith('.jpg') && !url.endsWith('.jpeg')) {
            throw new Error('Invalid image format')
        }

        if (!url.startsWith('http') && !url.startsWith('https')) {
            throw new Error('Invalid URL')
        }

        if (cache) {
            const path = toFileName(url)

            if (checkCache(path)) {
                return new Drawing(getCachePath(path))
            }

            const request = await fetch(url)
            const data = await request.arrayBuffer()
            saveToCache(path, Buffer.from(data))

            return new Drawing(getCachePath(path))
        }

        return new Drawing(url)
    }
}
