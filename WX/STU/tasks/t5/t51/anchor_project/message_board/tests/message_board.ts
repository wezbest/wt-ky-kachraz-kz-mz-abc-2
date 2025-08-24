import * as anchor from "@coral-xyz/anchor"
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js"
import { expect } from "chai"

describe("message_board", () => {
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)

  const program = anchor.workspace.MessageBoard
  const payer = provider.wallet as anchor.Wallet

  const treasury = Keypair.fromSecretKey(
    Uint8Array.from(require("../wallets/treasury.json"))
  )

  const counter = Keypair.generate()

  before(async () => {
    try {
      console.log("Airdropping 1 SOL to payer...")
      const airdropSig = await provider.connection.requestAirdrop(
        payer.publicKey,
        1 * LAMPORTS_PER_SOL
      )
      await provider.connection.confirmTransaction({
        signature: airdropSig,
        ...(await provider.connection.getLatestBlockhash()),
      })
      console.log("✅ Airdrop confirmed.")
    } catch (err) {
      console.warn("⚠️ Airdrop failed or not needed. Continuing...")
    }
  })

  it("Initializes the counter", async () => {
    await program.methods
      .initialize()
      .accounts({
        counter: counter.publicKey,
        payer: payer.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([counter])
      .rpc({
        skipPreflight: false,
        preflightCommitment: "confirmed",
      })

    const counterAccount = await program.account.messageCounter.fetch(
      counter.publicKey
    )
    expect(counterAccount.count.toString()).to.eq("0")
  })

  it("Posts a message for 69 lamports", async () => {
    const content = "gm 69"

    const [messagePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("message"), new anchor.BN(0).toArray("le", 8)],
      program.programId
    )

    try {
      await provider.connection.getLatestBlockhash()

      await program.methods
        .postMessage(content)
        .accounts({
          treasury: treasury.publicKey,
          message: messagePda,
          counter: counter.publicKey,
          payer: payer.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc({
          skipPreflight: false,
          preflightCommitment: "confirmed",
        })
    } catch (err: any) {
      console.error("Transaction failed:", err.message)
      if (err.logs) console.log("Program logs:", err.logs)
      throw err
    }

    const messageAccount = await program.account.message.fetch(messagePda)
    expect(messageAccount.content).to.eq(content)
    expect(messageAccount.poster.toString()).to.eq(payer.publicKey.toString())
  })

  // ❌ UNHAPPY PATH 1: Message too long
  it("Fails to post message longer than 100 characters", async () => {
    const content = "x".repeat(101) // 101 chars
    const [messagePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("message"), new anchor.BN(1).toArray("le", 8)],
      program.programId
    )

    try {
      await program.methods
        .postMessage(content)
        .accounts({
          treasury: treasury.publicKey,
          message: messagePda,
          counter: counter.publicKey,
          payer: payer.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc()
      expect.fail("Expected error due to long message")
    } catch (err: any) {
      expect(err.toString()).to.include("ContentTooLong")
      console.log("✅ Correctly rejected long message")
    }
  })

  // ❌ UNHAPPY PATH 2: Try to use wrong treasury
  it("Fails if treasury account is incorrect", async () => {
    const content = "gm"
    const fakeTreasury = Keypair.generate().publicKey
    const [messagePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("message"), new anchor.BN(2).toArray("le", 8)],
      program.programId
    )

    try {
      await program.methods
        .postMessage(content)
        .accounts({
          treasury: fakeTreasury,
          message: messagePda,
          counter: counter.publicKey,
          payer: payer.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc()
      expect.fail("Expected error due to wrong treasury")
    } catch (err: any) {
      expect(err.toString()).to.include("expected program owned") ||
        expect(err.toString()).to.include("missing required signature")
      console.log("✅ Correctly blocked wrong treasury")
    }
  })
})
