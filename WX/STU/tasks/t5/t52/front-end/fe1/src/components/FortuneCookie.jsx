// src/components/FortuneCookie.jsx
import { AnchorProvider, BN, Program } from "@coral-xyz/anchor" // Import BN for u64
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { PublicKey, SystemProgram } from "@solana/web3.js"
import { useState } from "react"

// --- Configuration ---
// Program ID from your successful deployment
const PROGRAM_ID_STR = "28fEBCBgk29YmK8dZWmbFyMawxFDVE8Hc6wyGHf8jHz4"
let programID = null
try {
  programID = new PublicKey(PROGRAM_ID_STR)
} catch (e) {
  console.error("Invalid Program ID provided:", PROGRAM_ID_STR)
}

const FORTUNE_FEE_LAMPORTS = 2 // Matches the fee in your Solana program
// --- End Configuration ---

export const FortuneCookie = () => {
  const { connection } = useConnection()
  const wallet = useWallet()
  const [fortune, setFortune] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  // State to manage the counter for multiple fortunes
  const [counter, setCounter] = useState(0)

  // Helper to correctly convert a JavaScript number to a u64 little-endian byte Buffer
  const numberToU64LEBytes = (num) => {
    const buffer = Buffer.alloc(8) // u64 is 8 bytes
    buffer.writeBigUInt64LE(BigInt(num), 0)
    return buffer
  }

  const getFortune = async () => {
    // 1. Validation Logic
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
      // 2. Provider Setup
      const provider = new AnchorProvider(connection, wallet, {})

      // 3. Fetch IDL from the public directory
      let idl = null
      try {
        const response = await fetch("/fortco.json")
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.statusText}`)
        }
        idl = await response.json()
        console.log("IDL loaded successfully.")
      } catch (fetchErr) {
        console.error("Error fetching IDL:", fetchErr)
        throw new Error(
          `Failed to load program interface (IDL): ${fetchErr.message}`
        )
      }

      // 4. Create Program Instance (Pass programID correctly)
      const program = new Program(idl, provider) // Pass programID here
      console.log("Program instance created.")

      // 5. Derive the Program Derived Address (PDA) - Include Counter
      // This must match the seeds in your Solana program: ["fortune", user_key, counter_u64_le_bytes]
      const [fortunePda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("fortune"),
          wallet.publicKey.toBuffer(),
          numberToU64LEBytes(counter), // Include the counter in seeds
        ],
        program.programId
      )
      console.log("Derived Fortune PDA:", fortunePda.toBase58())

      // 6. Call the program's getFortune method - Pass Counter and Fix Account Name
      console.log("Sending 'getFortune' transaction for counter:", counter)
      const tx = await program.methods
        .getFortune(new BN(counter)) // Pass the counter as a BN (u64) argument
        .accounts({
          // FIX 1: Use the correct account name 'fortune_data' as defined in the Rust struct
          // FIX 2: Use correct JavaScript object syntax (key: value)
          fortune_: fortunePda, // Changed from 'fortuneData'. Note the colon ':'
          user: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc()

      console.log("Transaction sent. Signature:", tx)

      // 7. Fetch the Result
      console.log("Fetching fortune data from PDA...")
      const fetchedFortuneAccount = await program.account.fortuneData.fetch(
        fortunePda
      )
      console.log("Fetched Fortune Account Data:", fetchedFortuneAccount)

      // 8. Update UI State
      setFortune(fetchedFortuneAccount.fortune)
      // Increment the counter for the next click
      setCounter((c) => c + 1)
    } catch (err) {
      console.error("Error occurred in getFortune:", err)
      // 9. Error Handling
      if (
        err &&
        err.error &&
        err.error.errorCode &&
        err.error.errorCode.code === "InsufficientPayment"
      ) {
        setError("Insufficient funds. You need at least 2 lamports.")
      } else {
        const errorMessage =
          (err && (err.message || err.toString())) ||
          "An unknown error occurred."
        setError(`Failed to get fortune: ${errorMessage}`)
      }
    } finally {
      // 10. Reset Loading State
      setIsLoading(false)
    }
  }

  // 11. JSX Rendering Logic
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-synthwave-dark rounded-xl shadow-lg border border-synthwave-purple max-w-md mx-auto mt-10 animate-float">
      <h2 className="text-2xl font-bold mb-4 text-synthwave-blue">
        Fortune Cookie
      </h2>
      <p className="text-sm mb-4 text-synthwave-pink">
        Cost: {FORTUNE_FEE_LAMPORTS} lamports
      </p>
      {/* Display current fortune number */}
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
