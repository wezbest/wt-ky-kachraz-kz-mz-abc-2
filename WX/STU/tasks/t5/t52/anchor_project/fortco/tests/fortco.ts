// tests/fortune-cookie.ts
import * as anchor from "@coral-xyz/anchor"
import { Program } from "@coral-xyz/anchor"
import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { FortuneCookie } from "../target/types/fortune_cookie"

describe("fortune-cookie", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)

  // Get the program IDL and program instance
  const program = anchor.workspace.FortuneCookie as Program<FortuneCookie>

  // Get the provider wallet (payer for transactions)
  const wallet = provider.wallet as anchor.Wallet

  // Test 1: Happy Path - User can get a fortune with exactly 2 SOL
  it("Happy Path: User gets a fortune with exactly 2 SOL payment", async () => {
    // Generate a new keypair for our test user
    const user = Keypair.generate()

    // Airdrop 2 SOL to the user (enough for payment but no extra for rent)
    const airdropSignature = await provider.connection.requestAirdrop(
      user.publicKey,
      2 * LAMPORTS_PER_SOL
    )
    await provider.connection.confirmTransaction(airdropSignature)

    // Derive the PDA for the fortune account using the user's public key
    const [fortunePda] = anchor.web3.PublicKey.findProgramAddressSync(
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

    // Verify the fortune was recorded correctly
    console.log("Fortune received:", fortuneAccount.fortune)
    console.log("User who received fortune:", fortuneAccount.user.toBase58())

    // Assert that the user key in the account matches our test user
    expect(fortuneAccount.user.toBase58()).to.equal(user.publicKey.toBase58())

    // Assert that a fortune string was actually saved
    expect(fortuneAccount.fortune).to.not.be.empty
  })

  // Test 2: Happy Path - User can get a fortune with more than 2 SOL
  it("Happy Path: User gets a fortune with more than 2 SOL payment", async () => {
    // Generate a new keypair for our test user
    const user = Keypair.generate()

    // Airdrop 5 SOL to the user (more than required)
    const airdropSignature = await provider.connection.requestAirdrop(
      user.publicKey,
      5 * LAMPORTS_PER_SOL
    )
    await provider.connection.confirmTransaction(airdropSignature)

    // Derive the PDA for the fortune account using the user's public key
    const [fortunePda] = anchor.web3.PublicKey.findProgramAddressSync(
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

    // Verify the fortune was recorded correctly
    console.log("Fortune received:", fortuneAccount.fortune)
    console.log("User who received fortune:", fortuneAccount.user.toBase58())

    // Assert that the user key in the account matches our test user
    expect(fortuneAccount.user.toBase58()).to.equal(user.publicKey.toBase58())

    // Assert that a fortune string was actually saved
    expect(fortuneAccount.fortune).to.not.be.empty
  })

  // Test 3: Unhappy Path - User tries to get fortune with insufficient funds
  it("Unhappy Path: User fails to get fortune with insufficient payment", async () => {
    // Generate a new keypair for our test user
    const user = Keypair.generate()

    // Airdrop only 1 SOL to the user (less than required 2 SOL)
    const airdropSignature = await provider.connection.requestAirdrop(
      user.publicKey,
      1 * LAMPORTS_PER_SOL
    )
    await provider.connection.confirmTransaction(airdropSignature)

    // Derive the PDA for the fortune account using the user's public key
    const [fortunePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("fortune"), user.publicKey.toBuffer()],
      program.programId
    )

    // Try to execute the get_fortune instruction - should fail
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
      // Verify we got the expected error code from our program
      expect(error.error.errorCode.code).to.equal("InsufficientPayment")
      console.log("Correctly rejected transaction with insufficient payment")
    }
  })

  // Test 4: Unhappy Path - User tries to get fortune without signing transaction
  it("Unhappy Path: Transaction fails when user doesn't sign", async () => {
    // Generate a new keypair for our test user
    const user = Keypair.generate()

    // Airdrop 3 SOL to the user (more than enough)
    const airdropSignature = await provider.connection.requestAirdrop(
      user.publicKey,
      3 * LAMPORTS_PER_SOL
    )
    await provider.connection.confirmTransaction(airdropSignature)

    // Derive the PDA for the fortune account using the user's public key
    const [fortunePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("fortune"), user.publicKey.toBuffer()],
      program.programId
    )

    // Try to execute the get_fortune instruction without the user's signature
    try {
      await program.methods
        .getFortune()
        .accounts({
          fortuneData: fortunePda,
          user: user.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        // Note: Not including user in signers - this should cause a signature verification error
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
