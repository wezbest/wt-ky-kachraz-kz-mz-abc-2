// src/components/FortuneCookie.jsx
import { AnchorProvider, Program } from "@coral-xyz/anchor"
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
      // AnchorProvider connects the Solana connection and the user's wallet
      const provider = new AnchorProvider(connection, wallet, {})

      // 3. Fetch IDL from the public directory
      // This is the standard way to load static assets placed in `public/`
      let idl = null
      try {
        // Vite serves files in `public/` at the root path, e.g., public/fortco.json -> /fortco.json
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

      // 4. Create Program Instance
      // This links the IDL, Program ID, and Provider to interact with the on-chain program
      const program = new Program(idl, programID, provider)
      console.log("Program instance created.")

      // 5. Derive the Program Derived Address (PDA)
      // This creates the unique address for the user's fortune account
      // It must match the seeds and program ID used in your Solana program
      const [fortunePda, bump] = PublicKey.findProgramAddressSync(
        [Buffer.from("fortune"), wallet.publicKey.toBuffer()], // Seeds
        program.programId // Program ID
      )
      console.log("Derived Fortune PDA:", fortunePda.toBase58())

      // 6. Call the program's getFortune method
      // This sends the transaction to the Solana network
      console.log("Sending 'getFortune' transaction...")
      const tx = await program.methods
        .getFortune() // Method name from your program's #[program] module
        .accounts({
          // Accounts required by the instruction, matching your Solana program's struct
          fortuneData: fortunePda, // The PDA account to be created/used
          user: wallet.publicKey, // The user's wallet (signer)
          systemProgram: SystemProgram.programId, // Required for account creation
        })
        .rpc() // Sends the transaction

      console.log("Transaction sent. Signature:", tx)

      // 7. Fetch the Result
      // After the transaction is confirmed, fetch the data from the created PDA account
      // A small delay can sometimes help ensure the account is ready, though not always necessary
      // await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("Fetching fortune data from PDA...")
      const fetchedFortuneAccount = await program.account.fortuneData.fetch(
        fortunePda
      )
      console.log("Fetched Fortune Account Data:", fetchedFortuneAccount)

      // 8. Update UI State
      // Set the fortune string in the component's state to display it
      setFortune(fetchedFortuneAccount.fortune)
    } catch (err) {
      console.error("Error occurred in getFortune:", err)
      // 9. Error Handling
      // Distinguish between custom program errors and other issues (network, wallet, etc.)
      if (
        err &&
        err.error &&
        err.error.errorCode &&
        err.error.errorCode.code === "InsufficientPayment"
      ) {
        // This specific error comes from your Solana program
        setError("Insufficient funds. You need at least 2 lamports.")
      } else {
        // Handle other errors (network issues, transaction failures, IDL problems, etc.)
        // Provide a user-friendly message, potentially including the technical error
        const errorMessage =
          (err && (err.message || err.toString())) ||
          "An unknown error occurred."
        setError(`Failed to get fortune: ${errorMessage}`)
      }
    } finally {
      // 10. Reset Loading State
      // Always turn off the loading indicator when the process finishes (success or error)
      setIsLoading(false)
    }
  }

  // 11. JSX Rendering Logic
  // This defines the component's UI based on its state
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-synthwave-dark rounded-xl shadow-lg border border-synthwave-purple max-w-md mx-auto mt-10 animate-float">
      <h2 className="text-2xl font-bold mb-4 text-synthwave-blue">
        Fortune Cookie
      </h2>
      <p className="text-sm mb-4 text-synthwave-pink">
        Cost: {FORTUNE_FEE_LAMPORTS} lamports
      </p>

      {/* Show content based on wallet connection status */}
      {wallet.connected ? (
        <>
          {/* Action Button */}
          <button
            onClick={getFortune}
            disabled={isLoading || !programID} // Disable while loading or if program ID is invalid
            className={`px-6 py-3 rounded-lg font-bold mb-4 transition-all duration-300 ${
              isLoading
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-synthwave-purple hover:bg-synthwave-pink cursor-pointer"
            } text-white shadow-synth hover:shadow-lg`}
          >
            {isLoading ? "Cracking..." : "Crack It!"}
          </button>

          {/* Loading Spinner */}
          {isLoading && (
            <div className="loader border-t-4 border-synthwave-blue rounded-full w-12 h-12 animate-spin mb-4"></div>
          )}

          {/* Error Message Display */}
          {error && (
            <div className="mt-4 p-3 bg-red-900/50 border border-red-500 rounded text-red-200 text-center">
              {error}
            </div>
          )}

          {/* Fortune Display */}
          {fortune && (
            <div className="mt-6 p-4 bg-synthwave-darker border-2 border-synthwave-blue rounded-lg text-center animate-pulse-slow">
              <p className="text-lg italic">"{fortune}"</p>
            </div>
          )}
        </>
      ) : (
        // Prompt to connect wallet if not connected
        <p className="text-synthwave-blue">
          Please connect your wallet to crack a fortune.
        </p>
      )}
    </div>
  )
}
