import * as anchor from "@coral-xyz/anchor";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { expect } from "chai";

// Load wallet helpers
const loadWallet = (path: string): Keypair => {
  return Keypair.fromSecretKey(
    Uint8Array.from(require(path))
  );
};

describe("message_board", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.MessageBoard;
  const payer = provider.wallet as anchor.Wallet;

  // 🛡️ Use PDAs, not random keypairs
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

  // ✅ HAPPY PATH 1: Initialize the message board
  it("Initializes the counter (idempotent)", async () => {
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

  // ✅ HAPPY PATH 2: Post a message for 69 lamports
  it("Posts a message for 69 lamports", async () => {
    const content = "gm 69";

    const [messagePda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("message"),
        counter.toBytes(),
        new anchor.BN(0).toArray("le", 8), // counter.count = 0
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
    console.log("💰 Treasury balance increased by 69 lamports");
  });

  // ✅ HAPPY PATH 3: Post a second message (count = 1)
  it("Posts a second message (count = 1)", async () => {
    const content = "gn 88";

    const [messagePda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("message"),
        counter.toBytes(),
        new anchor.BN(1).toArray("le", 8), // counter.count = 1
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
      .rpc({ skipPreflight: false, preflightCommitment: "confirmed" });

    const messageAccount = await program.account.message.fetch(messagePda);
    expect(messageAccount.content).to.eq(content);
    expect(messageAccount.poster.toString()).to.eq(payer.publicKey.toString());

    console.log("✅ Second message posted:", messagePda.toString());
  });

  // ❌ UNHAPPY PATH 1: Reject message longer than 100 chars
  it("Fails to post message longer than 100 characters", async () => {
    const content = "x".repeat(101); // 101 chars

    const [messagePda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("message"),
        counter.toBytes(),
        new anchor.BN(2).toArray("le", 8), // counter.count = 2
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

  // ❌ UNHAPPY PATH 2: Reject if wrong treasury is passed
  it("Fails if wrong treasury is passed", async () => {
    const content = "hijack attempt";
    const fakeTreasury = Keypair.generate().publicKey; // Not the real treasury

    const [messagePda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("message"),
        counter.toBytes(),
        new anchor.BN(3).toArray("le", 8),
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
      // The program will fail because fakeTreasury isn't the PDA
      // It may fail with "account not found" or during CPI
      expect(err.toString()).to.include("missing required signature") 
        || expect(err.toString()).to.include("failed to send transaction");
      console.log("✅ Correctly blocked wrong treasury");
    }
  });
});