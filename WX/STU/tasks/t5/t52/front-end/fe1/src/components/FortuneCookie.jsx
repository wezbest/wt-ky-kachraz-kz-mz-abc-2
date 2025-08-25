// src/components/FortuneCookie.jsx
import { AnchorProvider, Program } from "@coral-xyz/anchor"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { PublicKey, SystemProgram } from "@solana/web3.js"
import { useState } from "react"

import { Buffer } from "buffer"
window.Buffer = Buffer

// --- Configuration ---
// 1. REPLACE THIS WITH YOUR ACTUAL DEPLOYED PROGRAM ID
const PROGRAM_ID_STR = "YOUR_DEPLOYED_PROGRAM_ID_HERE"
let programID = null
try {
  programID = new PublicKey(PROGRAM_ID_STR)
} catch (e) {
  console.error("Invalid Program ID provided:", PROGRAM_ID_STR)
}

const FORTUNE_FEE_LAMPORTS = 2 // Matches your program
// --- End Configuration ---

export const FortuneCookie = () => {
  const { connection } = useConnection()
  const wallet = useWallet()
  const [fortune, setFortune] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const getFortune = async () => {
    // 2. Validation Logic
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
      // 3. Provider Setup
      const provider = new AnchorProvider(connection, wallet, {})

      // 4. Dynamically import IDL
      const idlModule = await import("/fortco.json")
      const idl = idlModule.default || idlModule

      // 5. Create Program Instance
      const program = new Program(idl, programID, provider)

      // 6. Derive PDA
      const [fortunePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("fortune"), wallet.publicKey.toBuffer()],
        program.programId
      )

      // 7. Call the program's getFortune method
      console.log("Sending transaction...")
      const tx = await program.methods
        .getFortune()
        .accounts({
          fortuneData: fortunePda,
          user: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc()

      console.log("Transaction signature:", tx)

      // 8. Fetch the result (add delay for confirmation if needed)
      // await new Promise(resolve => setTimeout(resolve, 1000)); // Optional delay
      const fetchedFortuneAccount = await program.account.fortuneData.fetch(
        fortunePda
      )
      console.log("Fetched Fortune Account:", fetchedFortuneAccount)
      setFortune(fetchedFortuneAccount.fortune)
    } catch (err) {
      console.error("Error in getFortune:", err)
      // 9. Error Handling
      // Check for custom program error
      if (
        err &&
        err.error &&
        err.error.errorCode &&
        err.error.errorCode.code === "InsufficientPayment"
      ) {
        setError("Insufficient funds. You need at least 2 lamports.")
      } else {
        // Fallback for other errors
        const errorMessage =
          (err && (err.message || err.toString())) || "Unknown error occurred."
        setError(`Failed to get fortune: ${errorMessage}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // 10. JSX Rendering Logic
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-synthwave-dark rounded-xl shadow-lg border border-synthwave-purple max-w-md mx-auto mt-10 animate-float">
      <h2 className="text-2xl font-bold mb-4 text-synthwave-blue">
        Fortune Cookie
      </h2>
      <p className="text-sm mb-4 text-synthwave-pink">
        Cost: {FORTUNE_FEE_LAMPORTS} lamports
      </p>

      {wallet.connected ? (
        <>
          <button
            onClick={getFortune}
            disabled={isLoading || !programID}
            className={`px-6 py-3 rounded-lg font-bold mb-4 transition-all duration-300 ${
              isLoading
                ? "bg-gray-500"
                : "bg-synthwave-purple hover:bg-synthwave-pink"
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
