import * as anchor from "@coral-xyz/anchor";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { expect } from "chai";

// Load the program and provider
describe("message_board", () => {
  // Use AnchorProvider.env() — reads from Anchor.toml
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  anchor.setProvider(provider);

  const program = anchor.workspace.MessageBoard;
  const payer = provider.wallet as anchor.Wallet;

  // ✅ Derive PDAs — no keypairs needed
  const [counter] = PublicKey.findProgramAddressSync(
    [Buffer.from("counter")],
    program.programId
  );

  const [treasury] = PublicKey.findProgramAddressSync(
    [Buffer.from("treasury")],
    program.programId
  );

  // Airdrop SOL before tests
  before(async () => {
    try {
      const connection = provider.connection;
      const balance = await connection.getBalance(payer.publicKey);
      if (balance < LAMPORTS_PER_SOL) {
        console.log("Airdropping 1 SOL to payer...");
        const airdropSig = await connection.requestAirdrop(
          payer.publicKey,
          2 * LAMPORTS_PER_SOL
        );
        await connection.confirmTransaction({
          signature: airdropSig,
          ...(await connection.getLatestBlockhash()),
        });
        console.log("✅ Airdrop confirmed.");
      }
    } catch (err) {
      console.warn("⚠️ Airdrop failed. Ensure your wallet has SOL on devnet.");
    }
  });

  // Retry helper for flaky Devnet
  const retry = async (fn: () => Promise<any>, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (err) {
        if (i === retries - 1) throw err;
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  };

  // ✅ HAPPY PATH 1: Initialize (idempotent)
  it("Initializes the counter", async () => {
    await retry(async () => {
      await program.methods
        .initialize()
        .accounts({
          counter,
          payer: payer.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc({ skipPreflight: true });
    });

    const counterAccount = await program.account.messageCounter.fetch(counter);
    expect(counterAccount.count.toString()).to.eq("0");
    console.log("✅ Counter initialized:", counter.toString());
  });

  // ✅ HAPPY PATH 2: Post first message
  it("Posts a message for 69 lamports", async () => {
    const content = "gm 69";

    const counterAccount = await program.account.messageCounter.fetch(counter);
    const currentCount = counterAccount.count;
    console.log("Current message count:", currentCount.toString());

    const [messagePda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("message"),
        counter.toBytes(),
        new anchor.BN(currentCount).toArray("le", 8),
      ],
      program.programId
    );

    const treasuryBalanceBefore = await provider.connection.getBalance(treasury);

    await retry(async () => {
      await program.methods
        .postMessage(content)
        .accounts({
          treasury,
          message: messagePda,
          counter,
          payer: payer.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc({ skipPreflight: true });
    });

    const messageAccount = await program.account.message.fetch(messagePda);
    expect(messageAccount.content).to.eq(content);
    expect(messageAccount.poster.toString()).to.eq(payer.publicKey.toString());

    const treasuryBalanceAfter = await provider.connection.getBalance(treasury);
    expect(treasuryBalanceAfter - treasuryBalanceBefore).to.eq(69);

    console.log("✅ Message posted:", messagePda.toString());
  });

  // ✅ HAPPY PATH 3: Post second message
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

    await retry(async () => {
      await program.methods
        .postMessage(content)
        .accounts({
          treasury,
          message: messagePda,
          counter,
          payer: payer.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc({ skipPreflight: true });
    });

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
        .rpc({ skipPreflight: true });
      expect.fail("Expected error due to long message");
    } catch (err: any) {
      expect(err.toString()).to.include("ContentTooLong");
      console.log("✅ Correctly rejected long message");
    }
  });

  // ❌ UNHAPPY PATH 2: Reject wrong treasury
  it("Fails if wrong treasury is passed", async () => {
    const content = "hijack attempt";
    const fakeTreasury = PublicKey.unique(); // Not the real treasury

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
        .rpc({ skipPreflight: true });
      expect.fail("Expected error due to wrong treasury");
    } catch (err: any) {
      // The treasury PDA requires program signature — missing here
      expect(err.toString()).to.include("missing required signature")
        || expect(err.toString()).to.include("Cross-program invocation with unauthorized signer or writable account");
      console.log("✅ Correctly blocked wrong treasury");
    }
  });
});