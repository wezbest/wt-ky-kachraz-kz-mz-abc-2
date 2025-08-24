import * as anchor from "@coral-xyz/anchor"
import { useWallet } from "@solana/wallet-adapter-react"
import * as web3 from "@solana/web3.js"
import confetti from "canvas-confetti"
import { useState } from "react"

const PROGRAM_ID = new web3.PublicKey(
  "71h1SPvHsxVXGqCvCZye1effpbKwYWCyYzuwFadEZ9VG"
)
const TREASURY = new web3.PublicKey("YOUR_TREASURY_WALLET_HERE")

export default function PostMessage() {
  const { publicKey, sendTransaction } = useWallet()
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const post = async () => {
    if (!message.trim()) return alert("Enter a message!")
    setLoading(true)

    try {
      const connection = new web3.Connection(
        "https://api.devnet.solana.com",
        "confirmed"
      )
      const idlResp = await fetch("/idl.json")
      const idl = await idlResp.json()
      const provider = new anchor.AnchorProvider(
        connection,
        { publicKey, sendTransaction },
        {}
      )
      const program = new anchor.Program(idl, PROGRAM_ID, provider)

      const [counterPda] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("counter")],
        PROGRAM_ID
      )

      const counterAccount = await program.account.messageCounter.fetch(
        counterPda
      )
      const [messagePda] = web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("message"),
          new anchor.BN(counterAccount.count).toArray("le", 8),
        ],
        PROGRAM_ID
      )

      const tx = await program.methods
        .postMessage(message)
        .accounts({
          treasury: TREASURY,
          message: messagePda,
          counter: counterPda,
          payer: publicKey!,
          systemProgram: web3.SystemProgram.programId,
        })
        .transaction()

      const blockhash = await connection.getLatestBlockhash()
      tx.recentBlockhash = blockhash.blockhash
      tx.feePayer = publicKey!

      const txid = await sendTransaction(tx, connection)
      console.log("TX:", txid)

      confetti({
        particleCount: 100,
        spread: 100,
        origin: { y: 0.6 },
        colors: ["#ff00ff", "#00ffff", "#ffffff"],
        ticks: 500,
      })

      setMessage("")
      alert("Posted for 69 lamports! 🚀")
    } catch (err: any) {
      alert("Error: " + err.message)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-8">
      <input
        type="text"
        placeholder="Type your message (100 chars)"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={loading}
        className="input mb-4"
        maxLength={100}
      />
      <button
        onClick={post}
        disabled={loading || !message.trim()}
        className="btn w-full"
      >
        {loading ? "Posting..." : "Post for 69 Lamports"}
      </button>
    </div>
  )
}
