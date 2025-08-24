import * as anchor from "@coral-xyz/anchor"
import * as web3 from "@solana/web3.js"
import { useEffect, useState } from "react"

const PROGRAM_ID = new web3.PublicKey(
  "71h1SPvHsxVXGqCvCZye1effpbKwYWCyYzuwFadEZ9VG"
)

export default function MessageList() {
  const [messages, setMessages] = useState<
    Array<{ publicKey: web3.PublicKey; account: any }>
  >([])

  useEffect(() => {
    fetchMessages()
  }, [])

  const fetchMessages = async () => {
    try {
      const connection = new web3.Connection(
        "https://api.devnet.solana.com",
        "confirmed"
      )
      const idlResp = await fetch("/idl.json")
      const idl = await idlResp.json()
      const provider = new anchor.AnchorProvider(connection, {}, {})
      const program = new anchor.Program(idl, PROGRAM_ID, provider)

      const accounts = await program.account.message.all()
      const sorted = accounts.sort(
        (a, b) =>
          b.account.timestamp.toNumber() - a.account.timestamp.toNumber()
      )
      setMessages(sorted)
    } catch (err) {
      console.error("Fetch failed:", err)
    }
  }

  return (
    <div className="mt-12 space-y-4">
      <h3 className="text-xl text-cyan-400 font-bold">Messages</h3>
      {messages.length === 0 ? (
        <p className="text-gray-400">No messages yet.</p>
      ) : (
        messages.map((msg) => (
          <div key={msg.publicKey.toString()} className="card">
            <p className="text-white">"{msg.account.content}"</p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date(
                msg.account.timestamp.toNumber() * 1000
              ).toLocaleString()}
            </p>
          </div>
        ))
      )}
    </div>
  )
}
