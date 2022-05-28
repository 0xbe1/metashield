import type { NextPage } from 'next'
import Head from 'next/head'
import React, { useEffect, useState } from 'react'
import axios from 'axios'
// import Select from 'react-select'
import { GetContractData } from './api/utils'

export type Result<T> =
  | {
      data: T
      error?: never
    }
  | {
      data?: never
      error: { message: string }
    }

interface NetworkOption {
  readonly value: Network
  readonly label: string
}

const networkOptions: readonly NetworkOption[] = [
  { value: 'arbitrum', label: 'Arbitrum' },
  { value: 'aurora', label: 'Aurora' },
  { value: 'avalanche', label: 'Avalanche' },
  { value: 'bsc', label: 'BSC' },
  { value: 'celo', label: 'Celo' },
  { value: 'ethereum', label: 'Ethereum' },
  { value: 'fantom', label: 'Fantom' },
  { value: 'gnosis', label: 'Gnosis (API unreliable)' },
  { value: 'hsc', label: 'HSC' },
  { value: 'moonbeam', label: 'Moonbeam' },
  { value: 'moonriver', label: 'Moonriver' },
  { value: 'optimism', label: 'Optimism' },
  { value: 'polygon', label: 'Polygon' },
]

export type Network =
  | 'arbitrum'
  | 'aurora'
  | 'avalanche'
  | 'bsc'
  | 'celo'
  | 'ethereum'
  | 'fantom'
  | 'gnosis'
  | 'hsc'
  | 'moonbeam'
  | 'moonriver'
  | 'optimism'
  | 'polygon'

function validateAddress(address: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(address)
}

const Answer = ({
  loading,
  network,
  address,
  result,
}: {
  loading: boolean
  network: Network | null
  address: string
  result: Result<GetContractData> | null
}) => {
  if (!network && !address) {
    return <p>Try it 👆</p>
  }
  if (network === null) {
    return <p>Choose a network 🤔</p>
  }
  if (address === '') {
    return <p>Paste an address 🤔</p>
  }
  if (!validateAddress(address)) {
    return <p>Invalid address 🤔</p>
  }
  if (loading) {
    return <p>loading... ⏳</p>
  }
  if (!result) {
    return <p>no data ❌</p>
  }
  if (result.error) {
    return <p>{result.error.message} ❌</p>
  }
  return (
    <div>
      <div className="flex flex-row justify-around text-purple-600">
        <div>
          Contract {result.data.IsContract ? '✅' : '❌'}{' '}
          {result.data.IsContract && (
            <a href={`https://etherscan.io/address/${address}`}>🔗</a>
          )}
        </div>
        <div>
          Verified {result.data.Verified ? '✅' : '❌'}{' '}
          {result.data.Verified && (
            <a href={`/api/code?network=${network}&address=${address}`}>🔗</a>
          )}
        </div>
      </div>
      <div className="mt-5 px-5 text-left text-sm">
        <p>
          Contract: A contract address rather than an externally owned accounts.
        </p>
        <p>
          Verified: A verified contract on Etherscan is considered to made open
          source.
        </p>
      </div>
    </div>
  )
}

const Home: NextPage = () => {
  // autofocus input, see https://reactjs.org/docs/hooks-reference.html#useref
  const inputElement = React.useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (inputElement.current) {
      inputElement.current.focus()
    }
  }, [])

  // const [network, setNetwork] = useState<Network | null>(null)
  const network = 'ethereum'
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result<GetContractData> | null>(null)

  // derived states
  const isValidInput: boolean = network !== null && validateAddress(address)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const { data } = await axios.get('api/contract', {
          params: {
            network,
            address,
          },
        })
        setResult(data)
      } catch (error: any) {
        setResult(null)
      }
      setLoading(false)
    }
    if (isValidInput) {
      fetchData()
    }
  }, [address, network])

  function handleAddressChange(event: React.FormEvent<HTMLInputElement>) {
    setAddress(event.currentTarget.value.trim().toLowerCase())
  }

  return (
    <div className="flex min-h-screen flex-col items-center font-mono">
      <Head>
        <title>MetaShield</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex w-full flex-1 items-center sm:w-4/5 lg:w-1/2">
        <div className="w-full">
          <div className=" text-center">
            <p className="text-6xl font-bold text-purple-600">MetaShield</p>
            <p className="mt-5 text-xl">Your 🛡️ in the Wild Web</p>
          </div>
          {/* <Select
            placeholder={'Select network'}
            className="basic-single my-5 text-center"
            classNamePrefix="select"
            name="networks"
            options={networkOptions}
            onChange={(selected) => {
              if (selected) {
                setNetwork(selected.value)
              }
            }}
          /> */}
          <input
            type="text"
            className="form-control relative my-4 block w-full min-w-0 flex-auto rounded border border-solid border-gray-300 bg-white bg-clip-padding px-3 py-1.5 text-center text-base font-normal text-gray-700 transition ease-in-out focus:border-blue-600 focus:bg-white focus:text-gray-700 focus:outline-none"
            placeholder="contract address"
            aria-label="Search"
            aria-describedby="button-addon2"
            value={address}
            onChange={handleAddressChange}
            ref={inputElement}
          />
          <div className="my-4 text-center text-xl">
            <Answer
              loading={loading}
              network={network}
              address={address}
              result={result}
            />
          </div>
        </div>
      </main>

      <footer className="flex h-16 w-full flex-col items-center justify-center border-t">
        Made by ❤️
      </footer>
    </div>
  )
}

export default Home
