export type Awaitable<T> = Promise<T> | T

export type RiotError = {
    status: {
        status_code: number
    }
}
