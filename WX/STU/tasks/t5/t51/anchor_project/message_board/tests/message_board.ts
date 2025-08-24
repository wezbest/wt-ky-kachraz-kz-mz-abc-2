import * as anchor from "@coral-xyz/anchor"
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js"
import { expect } from "chai"

describe("message_board", () => {
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)

  const program = anchor.workspace.MessageBoard
  const payer = provider.wallet as anchor.Wallet

  // ✅ Use PDAs, not keypairs
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

  // ✅ HAPPY PATH 1: Initialize the board
  it("Initializes the counter", async () => {
    await program.methods
      .initialize()
      .accounts({
        counter,
        payer: payer.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc({ skipPreflight: false, preflightCommitment: "confirmed" })

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
        payer: payer.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc({ skipPreflight: false, preflightCommitment: "confirmed" })

    const messageAccount = await program.account.message.fetch(messagePda)
    expect(messageAccount.content).to.eq(content)
    expect(messageAccount.poster.toString()).to.eq(payer.publicKey.toString())

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

  // ❌ UNHAPPY PATH 2: Reject incorrect treasury
  it("Fails if treasury account is incorrect", async () => {
    const content = "gm"
    const fakeTreasury = PublicKey.unique() // Not the real treasury PDA

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
          payer: payer.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc()
      expect.fail("Expected error due to wrong treasury")
    } catch (err: any) {
      // ✅ Anchor throws early: "Account does not match constraint"
      expect(err.toString()).to.include("AnchorError") &&
        expect(err.toString()).to.include("treasury")
      console.log("✅ Correctly blocked wrong treasury")
    }
  })
})
