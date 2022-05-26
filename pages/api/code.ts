import type { NextApiRequest, NextApiResponse } from 'next'
import { Network } from '..'
import { getCode } from './utils'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<string | { message: string }>
) {
  const address = req.query['address'] as string
  const network = req.query['network'] as Network

  const getCodeResult = await getCode(address, network)
  if (getCodeResult.error) {
    res.status(200).send(getCodeResult.error)
  } else {
    let code = getCodeResult.data.Code
    res.status(200).send(code)
  }
}
