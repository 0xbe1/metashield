import axios from 'axios'
import { Network, Result } from '..'

type Config = {
  [key in Network]: { scanDomain: string; apiKey: string }
}

type GetSourceCodeData = {
  ABI: string
  ContractName: string
  Implementation: string
  Proxy: string
  SourceCode: string
}

export type GetContractData = {
  ContractName: string
  Verified: boolean
  OpenSource: boolean
}

type GetCodeData = {
  ContractName: string
  Verified: boolean
  Code: string
}

const API_TIMEOUT = 5000

export const config: Config = {
  ethereum: {
    scanDomain: 'api.etherscan.io',
    apiKey: process.env.ETHERSCAN_API_KEY || '',
  },
  bsc: {
    scanDomain: 'api.bscscan.com',
    apiKey: process.env.BSCSCAN_API_KEY || '',
  },
  avalanche: {
    scanDomain: 'api.snowtrace.io',
    apiKey: process.env.SNOWTRACE_API_KEY || '',
  },
  fantom: {
    scanDomain: 'api.ftmscan.com',
    apiKey: process.env.FTMSCAN_API_KEY || '',
  },
  arbitrum: {
    scanDomain: 'api.arbiscan.io',
    apiKey: process.env.ARBISCAN_API_KEY || '',
  },
  polygon: {
    scanDomain: 'api.polygonscan.com',
    apiKey: process.env.POLYGONSCAN_API_KEY || '',
  },
  aurora: {
    scanDomain: 'api.aurorascan.dev',
    apiKey: process.env.AURORASCAN_API_KEY || '',
  },
  optimism: {
    scanDomain: 'api-optimistic.etherscan.io',
    apiKey: process.env.OPTIMISTIC_ETHERSCAN_API_KEY || '',
  },
  celo: {
    scanDomain: 'api.celoscan.xyz',
    apiKey: process.env.CELOSCAN_API_KEY || '',
  },
  gnosis: {
    scanDomain: 'blockscout.com/xdai/mainnet',
    apiKey: '', // no api key needed
  },
  hsc: {
    scanDomain: 'api.hooscan.com',
    apiKey: process.env.HOOSCAN_API_KEY || '',
  },
  moonriver: {
    scanDomain: 'api-moonriver.moonscan.io',
    apiKey: process.env.MOONRIVIER_MOONSCAN_API_KEY || '',
  },
  moonbeam: {
    scanDomain: 'api-moonbeam.moonscan.io',
    apiKey: process.env.MOONBEAM_MOONSCAN_API_KEY || '',
  },
}

export async function getCode(
  address: string,
  network: Network
): Promise<Result<GetCodeData>> {
  try {
    const { data } = await axios.get(
      `https://${config[network].scanDomain}/api`,
      {
        params: {
          module: 'contract',
          action: 'getsourcecode',
          address,
          apikey: config[network].apiKey,
        },
        timeout: API_TIMEOUT,
      }
    )
    if (data.status === '0') {
      return {
        error: {
          message: `[${data.message}] ${data.result}`,
        },
      }
    }
    let result = data.result[0] as GetSourceCodeData

    // it is the implementation
    if (result.Proxy === '0') {
      return {
        data: {
          ContractName: result.ContractName,
          Verified: result.ABI !== 'Contract source code not verified',
          Code: parseSourceCode(result.SourceCode),
        },
      }
    }

    // it is the proxy, go to implementation
    return getCode(result.Implementation, network)
  } catch (error: any) {
    console.log(JSON.stringify(error, Object.getOwnPropertyNames(error)))
    return {
      error: {
        message: 'unknown error',
      },
    }
  }
}

export async function getContract(
  address: string,
  network: Network
): Promise<Result<GetContractData>> {
  const getCodeResult = await getCode(address, network)
  if (getCodeResult.error) {
    return {
      error: {
        message: getCodeResult.error.message,
      },
    }
  }
  return {
    data: {
      ContractName: getCodeResult.data.ContractName,
      Verified: getCodeResult.data.Verified,
      OpenSource: getCodeResult.data.Code !== '',
    },
  }
}

function parseSourceCode(sourceCode: string): string {
  try {
    const jsonStr = sourceCode.substring(1, sourceCode.length - 1)
    const obj = JSON.parse(jsonStr)
    sourceCode = Object.entries<{ content: string }>(obj.sources).reduce(
      (prev, curr, i) =>
        prev +
        '\n' +
        (i === 0
          ? curr[1].content
          : filterOutSolidityFileHeader(curr[1].content)),
      ''
    )
  } catch (error: any) {
    // ignore
  }
  return sourceCode
}

function filterOutSolidityFileHeader(sourceCode: string): string {
  const lines = sourceCode.split('\n')
  const filteredLines = lines.filter((line) => {
    return !line.startsWith('pragma solidity') && !line.startsWith('import')
  })
  return filteredLines.join('\n')
}
