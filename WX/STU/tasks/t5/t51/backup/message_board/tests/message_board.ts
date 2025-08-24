import * as anchor from "@coral-xyz/anchor";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { expect } from "chai";

describe("message_board", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.MessageBoard;
  const payer = provider.wallet as anchor.Wallet;

  // ✅ Use PDAs, not keypairs
  const [counter] = PublicKey.findProgramAddressSync(
    [Buffer.from("counter")],
    program.programId
  );

  const [treasury] = PublicKey.findProgramAddressSync(
    [Buffer.from("treasury")],
    program.programId
  );

  before(async () => {
    try {
      console.log("Airdropping 1 SOL to payer...");
      const airdropSig = await provider.connection.requestAirdrop(
        payer.publicKey,
        1 * LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction({
        signature: airdropSig,
        ...(await provider.connection.getLatestBlockhash()),
      });
      console.log("✅ Airdrop confirmed.");
    } catch (err) {
      console.warn("⚠️ Airdrop failed or not needed. Continuing...");
    }
  });

  // ✅ HAPPY PATH 1: Initialize (idempotent)
  it("Initializes the counter", async () => {
    await program.methods
      .initialize()
      .accounts({
        counter,
        payer: payer.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc({ skipPreflight: false, preflightCommitment: "confirmed" });

    const counterAccount = await program.account.messageCounter.fetch(counter);
    expect(counterAccount.count.toString()).to.eq("0");
    console.log("✅ Counter initialized:", counter.toString());
  });

  // ✅ HAPPY PATH 2: Post a message using current count
  it("Posts a message for 69 lamports", async () => {
    const content = "gm 69";

    // ✅ Fetch current count from on-chain state
    const counterAccount = await program.account.messageCounter.fetch(counter);
    const currentCount = counterAccount.count;
    console.log("Current message count:", currentCount.toString());

    const [messagePda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("message"),
        counter.toBytes(),
        new anchor.BN(currentCount).toArray("le", 8), // ✅ Use real count
      ],
      program.programId
    );

    const initialTreasuryBalance = await provider.connection.getBalance(treasury);

    await program.methods
      .postMessage(content)
      .accounts({
        treasury,
        message: messagePda,
        counter,
        payer: payer.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc({ skipPreflight: false, preflightCommitment: "confirmed" });

    const messageAccount = await program.account.message.fetch(messagePda);
    expect(messageAccount.content).to.eq(content);
    expect(messageAccount.poster.toString()).to.eq(payer.publicKey.toString());

    const treasuryBalance = await provider.connection.getBalance(treasury);
    expect(treasuryBalance - initialTreasuryBalance).to.eq(69);

    console.log("✅ Message posted:", messagePda.toString());
  });

  // ✅ HAPPY PATH 3: Post a second message
  it("Posts a second message", async () => {
    const content = "gn 88";

    const counterAccount = await program.account.messageCounter.fetch(counter);
    const currentCount = counterAccount.count;
    console.log("Posting message #", currentCount.toString());

    const [messagePda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("message"),
        counter.toBytes(),
        new anchor.BN(currentCount).toArray("le", 8),
      ],
      program.programId
    );

    await program.methods
      .postMessage(content)
      .accounts({
        treasury,
        message: messagePda,
        counter,
        payer: payer.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const messageAccount = await program.account.message.fetch(messagePda);
    expect(messageAccount.content).to.eq(content);
    console.log("✅ Second message posted:", messagePda.toString());
  });

  // ❌ UNHAPPY PATH 1: Reject message > 100 chars
  it("Fails to post message longer than 100 characters", async () => {
    const content = "x".repeat(101);

    const counterAccount = await program.account.messageCounter.fetch(counter);
    const currentCount = counterAccount.count;

    const [messagePda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("message"),
        counter.toBytes(),
        new anchor.BN(currentCount).toArray("le", 8),
      ],
      program.programId
    );

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
        .rpc();
      expect.fail("Expected error due to long message");
    } catch (err: any) {
      expect(err.toString()).to.include("ContentTooLong");
      console.log("✅ Correctly rejected long message");
    }
  });

  // ❌ UNHAPPY PATH 2: Treasury transfer must use PDA (implicit security)
  it("Fails if wrong treasury is passed", async () => {
    const content = "hijack attempt";
    const fakeTreasury = PublicKey.unique(); // Invalid treasury

    const counterAccount = await program.account.messageCounter.fetch(counter);
    const currentCount = counterAccount.count;

    const [messagePda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("message"),
        counter.toBytes(),
        new anchor.BN(currentCount).toArray("le", 8),
      ],
      program.programId
    );

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
        .rpc();
      expect.fail("Expected error due to wrong treasury");
    } catch (err: any) {
      // Will fail during CPI (missing PDA signature)
      expect(err.toString()).to.include("missing required signature")
        || expect(err.toString()).to.include("failed to send transaction");
      console.log("✅ Correctly blocked wrong treasury");
    }
  });
});