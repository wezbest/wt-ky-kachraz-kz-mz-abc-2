// src/main.jsx
import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App.jsx" // Ensure .jsx extension
import "./index.css"
import { SolanaProvider } from "./providers/SolanaProvider.jsx" // Ensure .jsx extension

// Fix for Buffer if needed
import { Buffer } from "buffer"
window.Buffer = Buffer

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <SolanaProvider>
      <App />
    </SolanaProvider>
  </React.StrictMode>
)
