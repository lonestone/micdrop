import { z } from 'zod'

export const callParamsSchema = z.object({
  authorization: z.string(),
})

export type CallParams = z.infer<typeof callParamsSchema>
