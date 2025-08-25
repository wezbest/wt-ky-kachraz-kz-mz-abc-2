import * as anchor from "@coral-xyz/anchor"
import { AnchorProvider, Program } from "@coral-xyz/anchor"
import { Keypair, PublicKey } from "@solana/web3.js"
import { expect } from "chai"

// Load IDL from disk or build output
const idl = require("../target/idl/message_board.json")

describe("message_board", () => {
  // Set up provider from Anchor CLI/env
  const provider = anchor.getProvider() as AnchorProvider
  anchor.setProvider(provider)

  // Create program client
  const program = new Program(idl, provider)

  // Derive PDAs — no keypairs needed
  const [counter] = PublicKey.findProgramAddressSync(
    [Buffer.from("counter")],
    program.programId
  )

  const [treasury] = PublicKey.findProgramAddressSync(
    [Buffer.from("treasury")],
    program.programId
  )

  before(async () => {
    try {
      console.log("Airdropping 1 SOL to payer...")
      const airdropSig = await provider.connection.requestAirdrop(
        provider.wallet.publicKey,
        2 * anchor.web3.LAMPORTS_PER_SOL
      )
      await provider.connection.confirmTransaction(
        await provider.connection.getLatestBlockhash(),
        airdropSig
      )
      console.log("✅ Airdrop confirmed.")
    } catch (err) {
      console.warn("⚠️ Airdrop failed. Ensure wallet has SOL on devnet.")
    }
  })

  // ✅ HAPPY PATH 1: Initialize (idempotent)
  it("Initializes the counter", async () => {
    await program.methods
      .initialize()
      .accounts({
        counter,
        payer: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc({ skipPreflight: true })

    const counterAccount = await program.account.messageCounter.fetch(counter)
    expect(counterAccount.count.toString()).to.eq("0")
    console.log("✅ Counter initialized:", counter.toString())
  })

  // ✅ HAPPY PATH 2: Post a message
  it("Posts a message for 69 lamports", async () => {
    const content = "gm 69"

    const counterAccount = await program.account.messageCounter.fetch(counter)
    const currentCount = counterAccount.count
    console.log("Current message count:", currentCount)

    const [messagePda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("message"),
        counter.toBytes(),
        new anchor.BN(currentCount).toArray("le", 8),
      ],
      program.programId
    )

    const treasuryBalanceBefore = await provider.connection.getBalance(treasury)

    await program.methods
      .postMessage(content)
      .accounts({
        treasury,
        message: messagePda,
        counter,
        payer: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc({ skipPreflight: true })

    const messageAccount = await program.account.message.fetch(messagePda)
    expect(messageAccount.content).to.eq(content)
    expect(messageAccount.poster.toString()).to.eq(
      provider.wallet.publicKey.toString()
    )

    const treasuryBalanceAfter = await provider.connection.getBalance(treasury)
    expect(treasuryBalanceAfter - treasuryBalanceBefore).to.eq(69)

    console.log("✅ Message posted:", messagePda.toString())
  })

  // ❌ UNHAPPY PATH 1: Reject message > 100 chars
  it("Fails to post message longer than 100 characters", async () => {
    const content = "x".repeat(101)

    const counterAccount = await program.account.messageCounter.fetch(counter)
    const currentCount = counterAccount.count

    const [messagePda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("message"),
        counter.toBytes(),
        new anchor.BN(currentCount).toArray("le", 8),
      ],
      program.programId
    )

    try {
      await program.methods
        .postMessage(content)
        .accounts({
          treasury,
          message: messagePda,
          counter,
          payer: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc({ skipPreflight: true })
      expect.fail("Expected error due to long message")
    } catch (err: any) {
      expect(err.toString()).to.include("ContentTooLong")
      console.log("✅ Correctly rejected long message")
    }
  })

  // ❌ UNHAPPY PATH 2: Reject incorrect treasury
  it("Fails if treasury account is incorrect", async () => {
    const content = "gm"
    const fakeTreasury = Keypair.generate().publicKey

    const counterAccount = await program.account.messageCounter.fetch(counter)
    const currentCount = counterAccount.count

    const [messagePda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("message"),
        counter.toBytes(),
        new anchor.BN(currentCount).toArray("le", 8),
      ],
      program.programId
    )

    try {
      await program.methods
        .postMessage(content)
        .accounts({
          treasury: fakeTreasury,
          message: messagePda,
          counter,
          payer: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc({ skipPreflight: true })
      expect.fail("Expected error due to wrong treasury")
    } catch (err: any) {
      // Anchor throws early due to account constraint mismatch
      expect(err.toString()).to.include("AnchorError") &&
        expect(err.toString()).to.include("treasury")
      console.log("✅ Correctly blocked wrong treasury")
    }
  })
})
