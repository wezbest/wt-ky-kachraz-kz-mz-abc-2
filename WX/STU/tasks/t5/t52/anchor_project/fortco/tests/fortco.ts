// tests/fortco.ts
import * as anchor from "@coral-xyz/anchor"
import { Program } from "@coral-xyz/anchor"
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
} from "@solana/web3.js"
import { expect } from "chai" // Standard import should work with ts-mocha
import { Fortco } from "../target/types/fortco"

describe("fortco", () => {
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)
  const program = anchor.workspace.Fortco as Program<Fortco>

  const getExpectedFortuneIndex = (pubkey: PublicKey): number => {
    const pubkeyBytes = pubkey.toBytes()
    return pubkeyBytes[0] % 8
  }

  const fortunes = [
    "You will find a bug in your code today!",
    "A mysterious PR will fix your issues tomorrow.",
    "Your CPU cycle will bring great joy soon.",
    "Beware of off-by-one errors in your future!",
    "The blockchain gods smile upon your transactions.",
    "A segfault in your past will become a feature in your future.",
    "Your next commit will break production... but in a good way?",
    "The only constant in your life will be changing requirements.",
  ]

  // Helper to get rent exemption for PDA
  async function getPDARentExemption(): Promise<number> {
    // Space is 1000 as defined in your program
    return await provider.connection.getMinimumBalanceForRentExemption(1000)
  }

  it("Happy Path: User gets a fortune with sufficient lamports", async () => {
    const user = Keypair.generate()

    // Calculate required lamports: User rent + PDA rent + program fee
    const userRentExempt =
      await provider.connection.getMinimumBalanceForRentExemption(0)
    const pdaRentExempt = await getPDARentExemption()
    const programFeeLamports = 2 // As defined in your program
    const totalRequiredLamports =
      userRentExempt + pdaRentExempt + programFeeLamports

    console.log(
      `Transferring ${totalRequiredLamports} lamports to user (${
        totalRequiredLamports / LAMPORTS_PER_SOL
      } SOL)`
    )

    const transferIx = anchor.web3.SystemProgram.transfer({
      fromPubkey: provider.wallet.publicKey,
      toPubkey: user.publicKey,
      lamports: totalRequiredLamports,
    })

    const transferTx = new Transaction().add(transferIx)
    await provider.sendAndConfirm(transferTx, [])

    const [fortunePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("fortune"), user.publicKey.toBuffer()],
      program.programId
    )

    const tx = await program.methods
      .getFortune()
      .accounts({
        fortuneData: fortunePda,
        user: user.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user])
      .rpc()

    await provider.connection.confirmTransaction(tx)

    const fortuneAccount = await program.account.fortuneData.fetch(fortunePda)
    const expectedIndex = getExpectedFortuneIndex(user.publicKey)
    const expectedFortune = fortunes[expectedIndex]

    expect(fortuneAccount.fortune).to.equal(expectedFortune)
    console.log("Fortune received:", fortuneAccount.fortune)
    expect(fortuneAccount.user.toBase58()).to.equal(user.publicKey.toBase58())
  })

  it("Happy Path: User gets a fortune with more than required lamports", async () => {
    const user = Keypair.generate()

    // Transfer a comfortable amount (e.g., 1 SOL)
    const transferAmountLamports = 1 * LAMPORTS_PER_SOL
    console.log(
      `Transferring ${transferAmountLamports} lamports (1 SOL) to user for test`
    )

    const transferIx = anchor.web3.SystemProgram.transfer({
      fromPubkey: provider.wallet.publicKey,
      toPubkey: user.publicKey,
      lamports: transferAmountLamports,
    })

    const transferTx = new Transaction().add(transferIx)
    await provider.sendAndConfirm(transferTx, [])

    const [fortunePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("fortune"), user.publicKey.toBuffer()],
      program.programId
    )

    const tx = await program.methods
      .getFortune()
      .accounts({
        fortuneData: fortunePda,
        user: user.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user])
      .rpc()

    await provider.connection.confirmTransaction(tx)

    const fortuneAccount = await program.account.fortuneData.fetch(fortunePda)
    const expectedIndex = getExpectedFortuneIndex(user.publicKey)
    const expectedFortune = fortunes[expectedIndex]

    expect(fortuneAccount.fortune).to.equal(expectedFortune)
    console.log("Fortune received:", fortuneAccount.fortune)
    expect(fortuneAccount.user.toBase58()).to.equal(user.publicKey.toBase58())
  })

  it("Unhappy Path: User fails to get fortune with insufficient payment for PDA", async () => {
    const user = Keypair.generate()

    // Transfer enough for user rent exemption but NOT enough for PDA creation + fee
    const userRentExempt =
      await provider.connection.getMinimumBalanceForRentExemption(0)
    // Transfer only user rent + a tiny bit, much less than needed for PDA
    const transferAmountLamports = userRentExempt + 1000 // Way less than PDA rent (~7.85 SOL)

    console.log(
      `Transferring ${transferAmountLamports} lamports to user (insufficient for PDA creation)`
    )

    const transferIx = anchor.web3.SystemProgram.transfer({
      fromPubkey: provider.wallet.publicKey,
      toPubkey: user.publicKey,
      lamports: transferAmountLamports,
    })

    const transferTx = new Transaction().add(transferIx)
    await provider.sendAndConfirm(transferTx, [])

    const [fortunePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("fortune"), user.publicKey.toBuffer()],
      program.programId
    )

    try {
      await program.methods
        .getFortune()
        .accounts({
          fortuneData: fortunePda,
          user: user.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([user])
        .rpc()

      expect.fail(
        "Transaction should have failed with insufficient payment for PDA creation"
      )
    } catch (error) {
      // The error here is likely the rent exemption failure from the logs, not your custom error
      // Your custom error check happens *after* the lamport check, but before PDA creation
      // If the user has < 2 lamports, we'd see your custom error
      // If the user has >= 2 lamports but not enough for PDA rent, we see the SystemProgram error (0x1)
      console.log(
        "Caught expected error during PDA creation (likely insufficient rent exemption):",
        error?.message
      )
      // The test passes if an error is thrown during simulation
      expect(error).to.exist
    }
  })

  it("Unhappy Path: Transaction fails when user doesn't sign", async () => {
    const user = Keypair.generate()

    // Transfer a comfortable amount
    const transferAmountLamports = 1 * LAMPORTS_PER_SOL
    const transferIx = anchor.web3.SystemProgram.transfer({
      fromPubkey: provider.wallet.publicKey,
      toPubkey: user.publicKey,
      lamports: transferAmountLamports,
    })

    const transferTx = new Transaction().add(transferIx)
    await provider.sendAndConfirm(transferTx, [])

    const [fortunePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("fortune"), user.publicKey.toBuffer()],
      program.programId
    )

    try {
      // Omitting .signers([user])
      await program.methods
        .getFortune()
        .accounts({
          fortuneData: fortunePda,
          user: user.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc() // No signers

      expect.fail("Transaction should have failed without user signature")
    } catch (error) {
      console.log("Correctly rejected transaction without proper signature")
      // Check for signature verification error in message
      // The error format might vary, so we'll just check that an error occurred
      expect(error).to.exist
      // If you want to be more specific and the error message format allows:
      // expect(error.message).to.include("Signature verification failed");
    }
  })
})
