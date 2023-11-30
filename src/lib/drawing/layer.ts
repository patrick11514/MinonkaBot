import fetch from 'node-fetch'
import Sharp from 'sharp'
import { checkCache, getCachePath, saveToCache, toFileName } from '../cache'
import { position } from './main'
import { Text } from './text'

/**
 * Layer
 */
export class Layer {
    /**
     * Layer data
     */
    private canvas: Sharp.Sharp
    /**
     * Layers over the canvas
     */
    private layers: (Layer | Text)[] = []
    /**
     * Position in parent Canvas
     */
    public position: position
    /**
     * Metadata of image
     */
    private metadata: Sharp.Metadata | undefined

    /**
     * Constructor
     * @param source path to file or Sharp object
     * @param position position of layer in parent Canvas
     */
    constructor(source: string | Sharp.Sharp, position?: position) {
        if (typeof source === 'string') {
            this.canvas = Sharp(source)
        } else {
            this.canvas = source
        }

        this.position = position ?? {
            x: 0,
            y: 0,
        }
    }

    /**
     * Get metadata from image
     */
    async getMetadata() {
        this.metadata = await this.canvas.metadata()
    }

    /**
     * Get width of image
     * Can throw errors:
     * Metadata is not loaded, if you don't call getMetadata
     * Cannot determinate the width, if error occured
     * @returns width of image
     */
    get width(): number {
        if (this.metadata === undefined) throw 'Metadata is not loaded'
        if (this.metadata.width === undefined) throw 'Cannot determinate the width'

        return this.metadata.width
    }

    /**
     * Get height of image
     * Can throw errors:
     * Metadata is not loaded, if you don't call getMetadata
     * Cannot determinate the width, if error occured
     * @returns height of image
     */
    get height(): number {
        if (this.metadata === undefined) throw 'Metadata is not loaded'
        if (this.metadata.height === undefined) throw 'Cannot determinate the height'

        return this.metadata.height
    }

    /**
     * Set new position
     * @param newPosition
     * @returns this to chain operations
     */
    setPosition(newPosition: position) {
        this.position = newPosition
        return this
    }

    /**
     * Generate Layer from url
     * @param url Url to image
     * @param position Position in parent Canvas
     * @param cache Cache file?
     * @returns Layer object
     */
    static async fromURL(url: string, position?: position, cache = true): Promise<Layer> {
        if (!url.endsWith('.png') && !url.endsWith('.jpg') && !url.endsWith('.jpeg')) {
            throw new Error('Invalid image format')
        }

        if (!url.startsWith('http') && !url.startsWith('https')) {
            throw new Error('Invalid URL')
        }

        if (cache) {
            const path = toFileName(url)

            if (checkCache(path)) {
                return new Layer(getCachePath(path), position)
            }

            const request = await fetch(url)
            const data = await request.arrayBuffer()
            saveToCache(path, Buffer.from(data))

            return new Layer(getCachePath(path), position)
        }

        return new Layer(url, position)
    }

    /**
     * Add layer to image
     * @param layer Layer or Text
     * @returns this to chain operations
     */
    addLayer(layer: Layer | Text): this {
        this.layers.push(layer)
        return this
    }

    /**
     * Resize layer
     * Updates metadata if getMetadata was called before this function
     * @param width New width
     * @param height New height
     * @returns this to chain operations
     */
    async resize(width?: number, height?: number): Promise<Layer> {
        this.canvas.resize(width, height)

        if (this.metadata !== undefined) {
            const { info } = await this.canvas.toBuffer({ resolveWithObject: true })

            this.metadata.width = info.width
            this.metadata.height = info.height
        }

        return this
    }

    /**
     * Turn current layer with layers to buffer
     * @returns Image as Buffer
     */
    public async toBuffer(): Promise<Buffer> {
        const compositeList: {
            left: number
            top: number
            input: Buffer
        }[] = []

        for (const layer of this.layers) {
            compositeList.push({
                left: layer.position.x,
                top: layer.position.y,
                input: await layer.toBuffer(),
            })
        }

        if (compositeList.length > 0) {
            this.canvas.composite(compositeList)
        }

        return this.canvas.toBuffer()
    }
}
