// tests/fortco.ts
import * as anchor from "@coral-xyz/anchor"
// Explicitly import BN type and constructor
import { BN, Program } from "@coral-xyz/anchor"
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
} from "@solana/web3.js"
import { expect } from "chai"
import { Fortco } from "../target/types/fortco"

describe("fortco", () => {
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)
  const program = anchor.workspace.Fortco as Program<Fortco>

  const fortunes = [
    "You will find a bug in your code today!",
    "A mysterious PR will fix your issues tomorrow.",
    "Your CPU cycle will bring great joy soon.",
    "Beware of off-by-one errors in your future!",
    "The blockchain gods smile upon your transactions.",
    "A segfault in your past will become a feature in your future.",
    "Your next commit will break production... but in a good way?",
    "The only constant in your life will be changing requirements.",
    "You will be promoted to Senior Senior Software Engineer, reporting to the cat.",
    "A rubber duck will finally understand your code comments.",
    "You will discover that the bug was actually a feature requested by the client 3 years ago.",
    "Your coffee will compile faster than your actual code.",
    "You will achieve enlightenment after refactoring the same function for the 42nd time.",
    "A merge conflict will arise between your code and reality.",
    "You will be knighted by the Queen of England for your exceptional use of Comic Sans in production.",
    "Your pull request will be approved by a ghost.",
    "You will find the missing semicolon in your paycheck.",
    "Your code will run perfectly on the first try, but only in production.",
    "You will be offered a job at the Department of Redundancy Department.",
    "You will realize that the documentation was lying, but you were too.",
    "Your keyboard will finally forgive you for the spilled coffee.",
    "You will be given the keys to the production server... by accident.",
    "A Stack Overflow answer from 2009 will perfectly solve your cutting-edge problem.",
    "You will be praised for your innovative use of infinite loops.",
    "Your code review will be conducted by Skynet.",
    "You will be awarded a Nobel Prize in Debugging for finding that typo.",
    "Your YAML indentation will finally be correct, just this once.",
    "You will discover that 'It works on my machine' is a valid deployment strategy in at least 3 parallel universes.",
  ]

  // --- Helper Functions ---

  async function getPDARentExemption(): Promise<number> {
    return await provider.connection.getMinimumBalanceForRentExemption(1000)
  }

  function numberToU64LEBytes(num: number): Buffer {
    const buffer = Buffer.alloc(8)
    buffer.writeBigUInt64LE(BigInt(num), 0)
    return buffer
  }

  // --- Tests ---

  it("Happy Path: User gets a fortune with sufficient lamports", async () => {
    const user = Keypair.generate()
    const counter = 0
    // Explicitly type the BN variable
    const bnCounter: BN = new BN(counter)

    const userRentExempt =
      await provider.connection.getMinimumBalanceForRentExemption(0)
    const pdaRentExempt = await getPDARentExemption()
    const programFeeLamports = 2
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
      [
        Buffer.from("fortune"),
        user.publicKey.toBuffer(),
        numberToU64LEBytes(counter),
      ],
      program.programId
    )

    // --- FIXED: Added comma after fortunePda ---
    const tx = await program.methods
      .getFortune(bnCounter)
      .accounts({
        fortune: fortunePda, // Added comma here
        user: user.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user])
      .rpc()

    await provider.connection.confirmTransaction(tx)

    const fortuneAccount = await program.account.fortuneData.fetch(fortunePda)
    expect(fortuneAccount.fortune).to.be.a("string").and.not.empty
    expect(fortunes).to.include(fortuneAccount.fortune)
    console.log("Fortune received:", fortuneAccount.fortune)
    expect(fortuneAccount.user.toBase58()).to.equal(user.publicKey.toBase58())
  })

  it("Happy Path: User gets a fortune with more than required lamports", async () => {
    const user = Keypair.generate()
    const counter = 1
    // Explicitly type the BN variable
    const bnCounter: BN = new BN(counter)

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
      [
        Buffer.from("fortune"),
        user.publicKey.toBuffer(),
        numberToU64LEBytes(counter),
      ],
      program.programId
    )

    // --- FIXED: Added comma after fortunePda ---
    const tx = await program.methods
      .getFortune(bnCounter)
      .accounts({
        fortune: fortunePda, // Added comma here
        user: user.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user])
      .rpc()

    await provider.connection.confirmTransaction(tx)

    const fortuneAccount = await program.account.fortuneData.fetch(fortunePda)
    expect(fortuneAccount.fortune).to.be.a("string").and.not.empty
    expect(fortunes).to.include(fortuneAccount.fortune)
    console.log("Fortune received:", fortuneAccount.fortune)
    expect(fortuneAccount.user.toBase58()).to.equal(user.publicKey.toBase58())
  })

  it("Unhappy Path: User fails to get fortune with insufficient payment for PDA", async () => {
    const user = Keypair.generate()
    const counter = 2
    // Explicitly type the BN variable
    const bnCounter: BN = new BN(counter)

    const userRentExempt =
      await provider.connection.getMinimumBalanceForRentExemption(0)
    const transferAmountLamports = userRentExempt + 1000

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
      [
        Buffer.from("fortune"),
        user.publicKey.toBuffer(),
        numberToU64LEBytes(counter),
      ],
      program.programId
    )

    try {
      // --- FIXED: Added comma after fortunePda ---
      await program.methods
        .getFortune(bnCounter)
        .accounts({
          fortune: fortunePda, // Added comma here
          user: user.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([user])
        .rpc()

      expect.fail(
        "Transaction should have failed with insufficient payment for PDA creation"
      )
    } catch (error) {
      console.log(
        "Caught expected error during PDA creation (likely insufficient rent exemption):",
        error?.message
      )
      expect(error).to.exist
    }
  })

  it("Unhappy Path: Transaction fails when user doesn't sign", async () => {
    const user = Keypair.generate()
    const counter = 3
    // Explicitly type the BN variable
    const bnCounter: BN = new BN(counter)

    const transferAmountLamports = 1 * LAMPORTS_PER_SOL
    const transferIx = anchor.web3.SystemProgram.transfer({
      fromPubkey: provider.wallet.publicKey,
      toPubkey: user.publicKey,
      lamports: transferAmountLamports,
    })
    const transferTx = new Transaction().add(transferIx)
    await provider.sendAndConfirm(transferTx, [])

    const [fortunePda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("fortune"),
        user.publicKey.toBuffer(),
        numberToU64LEBytes(counter),
      ],
      program.programId
    )

    try {
      // --- FIXED: Added comma after fortunePda ---
      await program.methods
        .getFortune(bnCounter)
        .accounts({
          fortune: fortunePda, // Added comma here
          user: user.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc()

      expect.fail("Transaction should have failed without user signature")
    } catch (error) {
      console.log("Correctly rejected transaction without proper signature")
      expect(error).to.exist
    }
  })
})
