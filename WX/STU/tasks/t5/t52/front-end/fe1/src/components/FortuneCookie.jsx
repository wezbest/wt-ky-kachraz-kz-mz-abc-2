// src/components/FortuneCookie.jsx
import { AnchorProvider, BN, Program } from "@coral-xyz/anchor"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { PublicKey, SystemProgram } from "@solana/web3.js"
import { useState } from "react"

// --- Configuration ---
const PROGRAM_ID_STR = "8fCRvezhexJsx5Guy77p65rPdPV1bztSjE2a9GTTdFjA" // Match Rust program ID
let programID = null
try {
  programID = new PublicKey(PROGRAM_ID_STR)
} catch (e) {
  console.error("Invalid Program ID provided:", PROGRAM_ID_STR)
}

const FORTUNE_FEE_LAMPORTS = 2

export const FortuneCookie = () => {
  const { connection } = useConnection()
  const wallet = useWallet()
  const [fortune, setFortune] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [counter, setCounter] = useState(0)

  const numberToU64LEBytes = (num) => {
    const buffer = Buffer.alloc(8)
    buffer.writeBigUInt64LE(BigInt(num), 0)
    return buffer
  }

  const getFortune = async () => {
    if (!programID) {
      setError("Program ID is not configured correctly.")
      return
    }
    if (!wallet.connected || !wallet.publicKey) {
      setError("Please connect your wallet first.")
      return
    }

    setIsLoading(true)
    setError(null)
    setFortune(null)

    try {
      const provider = new AnchorProvider(connection, wallet, {})

      // Fetch IDL
      let idl = null
      try {
        const response = await fetch("/fortco.json")
        if (!response.ok)
          throw new Error(`Network response was not ok: ${response.statusText}`)
        idl = await response.json()
        console.log("IDL loaded successfully.")
      } catch (fetchErr) {
        console.error("Error fetching IDL:", fetchErr)
        throw new Error(
          `Failed to load program interface (IDL): ${fetchErr.message}`
        )
      }

      // ✅ FIXED: Remove programID parameter - use correct constructor
      const program = new Program(idl, provider)
      console.log("Program instance created.")

      // Derive PDA with current counter
      const [fortunePda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("fortune"),
          wallet.publicKey.toBuffer(),
          numberToU64LEBytes(counter),
        ],
        program.programId
      )
      console.log("Derived Fortune PDA:", fortunePda.toBase58())

      // Check if account already exists
      const accountInfo = await connection.getAccountInfo(fortunePda)
      if (accountInfo) {
        // Account exists, just fetch the fortune
        console.log("Account already exists, fetching...")
        const fetchedFortuneAccount = await program.account.fortuneData.fetch(
          fortunePda
        )
        setFortune(fetchedFortuneAccount.fortune)
        setCounter((c) => c + 1)
        setIsLoading(false)
        return
      }

      // Send transaction for new fortune
      console.log("Sending 'getFortune' transaction for counter:", counter)
      const tx = await program.methods
        .getFortune(new BN(counter))
        .accounts({
          fortuneData: fortunePda,
          user: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc()

      console.log("Transaction sent. Signature:", tx)

      // Fetch the result
      console.log("Fetching fortune data from PDA...")
      const fetchedFortuneAccount = await program.account.fortuneData.fetch(
        fortunePda
      )
      console.log("Fetched Fortune Account Data:", fetchedFortuneAccount)

      setFortune(fetchedFortuneAccount.fortune)
      setCounter((c) => c + 1)
    } catch (err) {
      console.error("Error occurred in getFortune:", err)

      // Handle specific errors using Anchor's error handling :cite[1]:cite[6]
      if (err.logs && err.logs.includes("already in use")) {
        // Account already exists, increment counter and try again
        setCounter((c) => c + 1)
        setError("Already got fortune #" + counter + ". Trying next fortune...")
        // Auto-retry with next counter
        setTimeout(() => getFortune(), 1000)
      } else if (err.error?.errorCode?.code === "InsufficientPayment") {
        setError("Insufficient funds. You need at least 2 lamports.")
      } else {
        const errorMessage =
          err?.message || err?.toString() || "An unknown error occurred."
        setError(`Failed to get fortune: ${errorMessage}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-synthwave-dark rounded-xl shadow-lg border border-synthwave-purple max-w-md mx-auto mt-10 animate-float">
      <h2 className="text-2xl font-bold mb-4 text-synthwave-blue">
        Fortune Cookie
      </h2>
      <p className="text-sm mb-4 text-synthwave-pink">
        Cost: {FORTUNE_FEE_LAMPORTS} lamports
      </p>

      {wallet.connected && (
        <p className="text-xs mb-2 text-synthwave-grid">
          Fortune #{counter + 1} for this wallet
        </p>
      )}

      {wallet.connected ? (
        <>
          <button
            onClick={getFortune}
            disabled={isLoading || !programID}
            className={`px-6 py-3 rounded-lg font-bold mb-4 transition-all duration-300 ${
              isLoading
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-synthwave-purple hover:bg-synthwave-pink cursor-pointer"
            } text-white shadow-synth hover:shadow-lg`}
          >
            {isLoading ? "Cracking..." : "Crack It!"}
          </button>

          {isLoading && (
            <div className="loader border-t-4 border-synthwave-blue rounded-full w-12 h-12 animate-spin mb-4"></div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-900/50 border border-red-500 rounded text-red-200 text-center">
              {error}
            </div>
          )}

          {fortune && (
            <div className="mt-6 p-4 bg-synthwave-darker border-2 border-synthwave-blue rounded-lg text-center animate-pulse-slow">
              <p className="text-lg italic">"{fortune}"</p>
            </div>
          )}
        </>
      ) : (
        <p className="text-synthwave-blue">
          Please connect your wallet to crack a fortune.
        </p>
      )}
    </div>
  )
}
