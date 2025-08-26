// src/App.jsx
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { FortuneCookie } from "./components/FortuneCookie" // Ensure .jsx extension if needed

const App = () => {
  // Removed type annotation
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <header className="w-full max-w-4xl flex justify-end mb-8">
        <WalletMultiButton />
      </header>
      <main className="flex-grow flex flex-col items-center justify-center w-full">
        <h1 className="text-4xl md:text-5xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-synthwave-purple to-synthwave-pink">
          Synthwave Fortune Cookie
        </h1>
        <p className="text-synthwave-blue mb-8">
          Morektz Ackee School of Solana Project - Pay 2 lamports, get a
          hilarious fortune!
        </p>
        <FortuneCookie />
      </main>
      <footer className="mt-8 text-synthwave-grid text-sm">
        Powered by x.com/morektz
      </footer>
    </div>
  )
}

export default App
