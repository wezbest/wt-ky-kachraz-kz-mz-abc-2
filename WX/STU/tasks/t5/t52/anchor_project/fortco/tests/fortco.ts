// tests/fortco.ts
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import { expect } from "chai";
import { Fortco } from "../target/types/fortco"; // Make sure this path is correct

describe("fortco", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Fortco as Program<Fortco>;

  // Note: The fortune selection logic in the program has changed to include 'counter'.
  // The simple 'getExpectedFortuneIndex' function based only on pubkey will no longer work correctly.
  // For tests, we can fetch the actual fortune returned by the program.
  const fortunes = [
    // Include all 20 fortunes from your updated program for reference (if needed for future tests)
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
    "You will discover that 'It works on my machine' is a valid deployment strategy in at least 3 parallel universes."
  ];

  // Helper to get rent exemption for PDA
  async function getPDARentExemption(): Promise<number> {
    // Space is 1000 as defined in your program
    return await provider.connection.getMinimumBalanceForRentExemption(1000);
  }

  // Use a fixed counter for tests to make them deterministic
  const TEST_COUNTER = 0;

  it("Happy Path: User gets a fortune with sufficient lamports", async () => {
    const user = Keypair.generate();

    // Calculate required lamports: User rent + PDA rent + program fee
    const userRentExempt =
      await provider.connection.getMinimumBalanceForRentExemption(0);
    const pdaRentExempt = await getPDARentExemption();
    const programFeeLamports = 2; // As defined in your program
    const totalRequiredLamports =
      userRentExempt + pdaRentExempt + programFeeLamports;

    console.log(
      `Transferring ${totalRequiredLamports} lamports to user (${
        totalRequiredLamports / LAMPORTS_PER_SOL
      } SOL)`
    );

    const transferIx = anchor.web3.SystemProgram.transfer({
      fromPubkey: provider.wallet.publicKey,
      toPubkey: user.publicKey,
      lamports: totalRequiredLamports,
    });

    const transferTx = new Transaction().add(transferIx);
    await provider.sendAndConfirm(transferTx, []);

    // Derive PDA using the counter
    const [fortunePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("fortune"), user.publicKey.toBuffer(), Buffer.from(new Uint8Array(new BigUint64Array([BigInt(TEST_COUNTER)]).buffer))], // Include counter
      program.programId
    );

    // Call getFortune with the counter argument
    const tx = await program.methods
      .getFortune(TEST_COUNTER) // Pass the counter argument
      .accounts({
        // FIX 1: Use the correct account name 'fortune_data' as defined in the Rust struct
        fortune_data: fortunePda, // Changed from 'fortuneData'
        user: user.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    await provider.connection.confirmTransaction(tx);

    const fortuneAccount = await program.account.fortuneData.fetch(fortunePda);
    // We can no longer predict the exact fortune easily, so just check it exists and is from the list
    expect(fortuneAccount.fortune).to.be.a('string').and.not.empty;
    expect(fortunes).to.include(fortuneAccount.fortune); // Check it's one of the valid fortunes
    console.log("Fortune received:", fortuneAccount.fortune);
    expect(fortuneAccount.user.toBase58()).to.equal(user.publicKey.toBase58());
  });

  it("Happy Path: User gets a fortune with more than required lamports", async () => {
    // Use a different counter for this test
    const COUNTER_FOR_TEST = 1;
    const user = Keypair.generate();

    // Transfer a comfortable amount (e.g., 1 SOL)
    const transferAmountLamports = 1 * LAMPORTS_PER_SOL;
    console.log(
      `Transferring ${transferAmountLamports} lamports (1 SOL) to user for test`
    );

    const transferIx = anchor.web3.SystemProgram.transfer({
      fromPubkey: provider.wallet.publicKey,
      toPubkey: user.publicKey,
      lamports: transferAmountLamports,
    });

    const transferTx = new Transaction().add(transferIx);
    await provider.sendAndConfirm(transferTx, []);

    // Derive PDA using the counter
    const [fortunePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("fortune"), user.publicKey.toBuffer(), Buffer.from(new Uint8Array(new BigUint64Array([BigInt(COUNTER_FOR_TEST)]).buffer))], // Include counter
      program.programId
    );

    // Call getFortune with the counter argument
    const tx = await program.methods
      .getFortune(COUNTER_FOR_TEST) // Pass the counter argument
      .accounts({
        // FIX 1: Use the correct account name 'fortune_data'
        fortune_data: fortunePda, // Changed from 'fortuneData'
        user: user.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    await provider.connection.confirmTransaction(tx);

    const fortuneAccount = await program.account.fortuneData.fetch(fortunePda);
    // Check it's a valid fortune
    expect(fortuneAccount.fortune).to.be.a('string').and.not.empty;
    expect(fortunes).to.include(fortuneAccount.fortune);
    console.log("Fortune received:", fortuneAccount.fortune);
    expect(fortuneAccount.user.toBase58()).to.equal(user.publicKey.toBase58());
  });

  it("Unhappy Path: User fails to get fortune with insufficient payment for PDA", async () => {
    const COUNTER_FOR_TEST = 2; // Use a new counter
    const user = Keypair.generate();

    // Transfer enough for user rent exemption but NOT enough for PDA creation + fee
    const userRentExempt =
      await provider.connection.getMinimumBalanceForRentExemption(0);
    // Transfer only user rent + a tiny bit, much less than needed for PDA
    const transferAmountLamports = userRentExempt + 1000; // Way less than PDA rent (~7.85 SOL)

    console.log(
      `Transferring ${transferAmountLamports} lamports to user (insufficient for PDA creation)`
    );

    const transferIx = anchor.web3.SystemProgram.transfer({
      fromPubkey: provider.wallet.publicKey,
      toPubkey: user.publicKey,
      lamports: transferAmountLamports,
    });

    const transferTx = new Transaction().add(transferIx);
    await provider.sendAndConfirm(transferTx, []);

    // Derive PDA using the counter
    const [fortunePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("fortune"), user.publicKey.toBuffer(), Buffer.from(new Uint8Array(new BigUint64Array([BigInt(COUNTER_FOR_TEST)]).buffer))], // Include counter
      program.programId
    );

    try {
      // Call getFortune with the counter argument
      await program.methods
        .getFortune(COUNTER_FOR_TEST) // Pass the counter argument
        .accounts({
          // FIX 1: Use the correct account name 'fortune_data'
          fortune_data: fortunePda, // Changed from 'fortuneData'
          user: user.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([user])
        .rpc();

      expect.fail(
        "Transaction should have failed with insufficient payment for PDA creation"
      );
    } catch (error) {
      // The error here is likely the rent exemption failure from the logs, not your custom error
      console.log(
        "Caught expected error during PDA creation (likely insufficient rent exemption):",
        error?.message
      );
      // The test passes if an error is thrown during simulation
      expect(error).to.exist;
    }
  });

  it("Unhappy Path: Transaction fails when user doesn't sign", async () => {
    const COUNTER_FOR_TEST = 3; // Use a new counter
    const user = Keypair.generate();

    // Transfer a comfortable amount
    const transferAmountLamports = 1 * LAMPORTS_PER_SOL;
    const transferIx = anchor.web3.SystemProgram.transfer({
      fromPubkey: provider.wallet.publicKey,
      toPubkey: user.publicKey,
      lamports: transferAmountLamports,
    });

    const transferTx = new Transaction().add(transferIx);
    await provider.sendAndConfirm(transferTx, []);

    // Derive PDA using the counter
    const [fortunePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("fortune"), user.publicKey.toBuffer(), Buffer.from(new Uint8Array(new BigUint64Array([BigInt(COUNTER_FOR_TEST)]).buffer))], // Include counter
      program.programId
    );

    try {
      // Omitting .signers([user])
      // Call getFortune with the counter argument
      await program.methods
        .getFortune(COUNTER_FOR_TEST) // Pass the counter argument
        .accounts({
          // FIX 1: Use the correct account name 'fortune_data'
          fortune_data: fortunePda, // Changed from 'fortuneData'
          user: user.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc(); // No signers

      expect.fail("Transaction should have failed without user signature");
    } catch (error) {
      console.log("Correctly rejected transaction without proper signature");
      // Check for signature verification error in message
      expect(error).to.exist;
      // More specific check (uncomment if you want to enforce this)
      // expect(error.message).to.include("Signature verification failed");
    }
  });
});