import { errorSchema } from '$/lib/RiotAPI'
import '@total-typescript/ts-reset'
import { z } from 'zod'

export type Awaitable<T> = Promise<T> | T

export type RiotAPILanguages = 'en_US' | 'cs_CZ'

export type RiotError = {
    status: {
        status_code: number
    }
}

export type errorResponse =
    | {
          status: false
          errorSchema: true
          data: z.infer<typeof errorSchema>
      }
    | {
          status: false
          errorSchema: false
      }
