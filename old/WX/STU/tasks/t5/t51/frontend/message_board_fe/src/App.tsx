import { useWallet } from "@solana/wallet-adapter-react"
import MessageList from "./components/MessageList"
import PostMessage from "./components/PostMessage"
import WalletConnect from "./components/WalletConnect"

export default function App() {
  const { connected } = useWallet()

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl text-pink-500 text-center animate-pulse mb-4 font-black">
        📬 69 LAMPORT WALL
      </h1>
      <p className="text-center text-gray-300 mb-8">
        Post anything. Pay in vibes.
      </p>

      <div className="flex justify-center mb-8">
        <WalletConnect />
      </div>

      {connected && (
        <div className="max-w-2xl mx-auto">
          <PostMessage />
          <MessageList />
        </div>
      )}
    </div>
  )
}
