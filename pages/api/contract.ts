import type { NextApiRequest, NextApiResponse } from 'next'
import { Network, Result } from '..'
import { getContract, GetContractData, isContract } from './utils'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Result<GetContractData>>
) {
  const address = req.query['address'] as string
  const network = req.query['network'] as Network
  const isContractResult = await isContract(address, network)
  if (isContractResult.error) {
    res.status(200).send({
      error: {
        message: isContractResult.error.message,
      },
    })
    return
  }
  if (!isContractResult.data) {
    res.status(200).send({
      data: {
        IsContract: false,
        Verified: false,
      },
    })
    return
  }
  const getContractResult = await getContract(address, network)
  res.status(200).send(getContractResult)
}
