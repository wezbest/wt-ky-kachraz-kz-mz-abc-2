import { BackpackWalletAdapter } from "@solana/wallet-adapter-backpack" // ✅ Correct
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react"
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui"
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets"
import { createRoot } from "react-dom/client"
import App from "./App"
import "./index.css"

const wallets = [new PhantomWalletAdapter(), new BackpackWalletAdapter()]

createRoot(document.getElementById("root")!).render(
  <ConnectionProvider endpoint="https://api.devnet.solana.com">
    <WalletProvider wallets={wallets} autoConnect>
      <WalletModalProvider>
        <App />
      </WalletModalProvider>
    </WalletProvider>
  </ConnectionProvider>
)
