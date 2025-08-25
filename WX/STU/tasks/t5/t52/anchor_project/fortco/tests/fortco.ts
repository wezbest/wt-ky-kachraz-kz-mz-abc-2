// tests/fortune-cookie.ts
import * as anchor from "@coral-xyz/anchor"
import { Program } from "@coral-xyz/anchor"
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js"
import { FortuneCookie } from "../target/types/fortune_cookie"

describe("fortune-cookie", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)

  // Get the program IDL and program instance
  const program = anchor.workspace.FortuneCookie as Program<FortuneCookie>

  // Helper function to generate deterministic fortune index
  // Matches the logic in the program: first byte of pubkey % 8
  const getExpectedFortuneIndex = (pubkey: PublicKey): number => {
    const pubkeyBytes = pubkey.toBytes()
    return pubkeyBytes[0] % 8
  }

  // List of fortunes from the program (must match exactly)
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

  // Happy Path Test 1: User with exactly 2 SOL can get a fortune
  it("Happy Path: User gets a fortune with exactly 2 SOL payment", async () => {
    // Create a new user for this test to ensure deterministic results
    const user = Keypair.generate()

    // Airdrop exactly 2 SOL to the user
    const airdropSignature = await provider.connection.requestAirdrop(
      user.publicKey,
      2 * LAMPORTS_PER_SOL
    )
    await provider.connection.confirmTransaction(airdropSignature)

    // Derive the PDA for the fortune account using the user's public key
    // This matches the seeds in the program: [b"fortune", user.key().as_ref()]
    const [fortunePda, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("fortune"), user.publicKey.toBuffer()],
      program.programId
    )

    // Execute the get_fortune instruction
    // The user must sign since they're a Signer in the accounts struct
    const tx = await program.methods
      .getFortune()
      .accounts({
        fortuneData: fortunePda,
        user: user.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user])
      .rpc()

    // Confirm the transaction was successful
    await provider.connection.confirmTransaction(tx)

    // Fetch the created fortune account data
    const fortuneAccount = await program.account.fortuneData.fetch(fortunePda)

    // Calculate the expected fortune based on deterministic logic
    const expectedIndex = getExpectedFortuneIndex(user.publicKey)
    const expectedFortune = fortunes[expectedIndex]

    // Verify the fortune matches our expectation
    expect(fortuneAccount.fortune).to.equal(expectedFortune)
    console.log("Fortune received:", fortuneAccount.fortune)

    // Verify the user key in the account matches our test user
    expect(fortuneAccount.user.toBase58()).to.equal(user.publicKey.toBase58())
  })

  // Happy Path Test 2: User with more than 2 SOL can get a fortune
  it("Happy Path: User gets a fortune with more than 2 SOL payment", async () => {
    // Create a new user for this test
    const user = Keypair.generate()

    // Airdrop 10 SOL to the user (more than required)
    const airdropSignature = await provider.connection.requestAirdrop(
      user.publicKey,
      10 * LAMPORTS_PER_SOL
    )
    await provider.connection.confirmTransaction(airdropSignature)

    // Derive the PDA for the fortune account
    const [fortunePda, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("fortune"), user.publicKey.toBuffer()],
      program.programId
    )

    // Execute the get_fortune instruction
    const tx = await program.methods
      .getFortune()
      .accounts({
        fortuneData: fortunePda,
        user: user.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user])
      .rpc()

    // Confirm the transaction was successful
    await provider.connection.confirmTransaction(tx)

    // Fetch the created fortune account data
    const fortuneAccount = await program.account.fortuneData.fetch(fortunePda)

    // Calculate the expected fortune based on deterministic logic
    const expectedIndex = getExpectedFortuneIndex(user.publicKey)
    const expectedFortune = fortunes[expectedIndex]

    // Verify the fortune matches our expectation
    expect(fortuneAccount.fortune).to.equal(expectedFortune)
    console.log("Fortune received:", fortuneAccount.fortune)

    // Verify the user key in the account matches our test user
    expect(fortuneAccount.user.toBase58()).to.equal(user.publicKey.toBase58())
  })

  // Unhappy Path Test 1: User with insufficient funds gets rejected
  it("Unhappy Path: User fails to get fortune with insufficient payment", async () => {
    // Create a new user for this test
    const user = Keypair.generate()

    // Airdrop only 1 SOL to the user (less than required 2 SOL)
    const airdropSignature = await provider.connection.requestAirdrop(
      user.publicKey,
      1 * LAMPORTS_PER_SOL
    )
    await provider.connection.confirmTransaction(airdropSignature)

    // Derive the PDA for the fortune account
    const [fortunePda, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("fortune"), user.publicKey.toBuffer()],
      program.programId
    )

    // Try to execute the get_fortune instruction - should fail with our custom error
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

      // If we reach this point, the test should fail because we expected an error
      expect.fail("Transaction should have failed with insufficient payment")
    } catch (error) {
      // Verify we got the expected custom error code from our program
      expect(error.error.errorCode.code).to.equal("InsufficientPayment")
      console.log("Correctly rejected transaction with insufficient payment")
    }
  })

  // Unhappy Path Test 2: Transaction fails when user doesn't sign
  it("Unhappy Path: Transaction fails when user doesn't sign", async () => {
    // Create a new user for this test
    const user = Keypair.generate()

    // Airdrop 5 SOL to the user (more than enough)
    const airdropSignature = await provider.connection.requestAirdrop(
      user.publicKey,
      5 * LAMPORTS_PER_SOL
    )
    await provider.connection.confirmTransaction(airdropSignature)

    // Derive the PDA for the fortune account
    const [fortunePda, bump] = PublicKey.findProgramAddressSync(
      [Buffer.from("fortune"), user.publicKey.toBuffer()],
      program.programId
    )

    // Try to execute the get_fortune instruction without the user's signature
    try {
      // Note: Not including user in signers - this should cause a signature verification error
      await program.methods
        .getFortune()
        .accounts({
          fortuneData: fortunePda,
          user: user.publicKey, // User is still required in accounts
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        // Intentionally omitting .signers([user]) to trigger signature error
        .rpc()

      // If we reach this point, the test should fail because we expected an error
      expect.fail("Transaction should have failed without user signature")
    } catch (error) {
      // Verify we got a signature verification error
      // This will be a transaction error rather than our custom program error
      console.log("Correctly rejected transaction without proper signature")
      expect(error.message).to.include("Signature verification failed")
    }
  })
})
