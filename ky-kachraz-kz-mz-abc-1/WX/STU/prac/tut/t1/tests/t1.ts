import * as anchor from "@coral-xyz/anchor"
import { Program } from "@coral-xyz/anchor"
import { T1 } from "../target/types/t1"

describe("t1", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env())

  const program = anchor.workspace.t1 as Program<T1>

  // Load existing wallet instead of generating new keypairs
  const signer = anchor.web3.Keypair.fromSecretKey(
    new Uint8Array(
      JSON.parse(
        require("fs").readFileSync("./solana_wallets/wallet_0.json", "utf-8")
      )
    )
  )

  // Create a new keypair for data account
  const dataAccount = anchor.web3.Keypair.generate()

  it("Is initialized!", async () => {
    // Fund the data account from the signer to cover rent exemption
    const rentExemptAmount =
      await program.provider.connection.getMinimumBalanceForRentExemption(0)

    const transferTx = new anchor.web3.Transaction().add(
      anchor.web3.SystemProgram.transfer({
        fromPubkey: signer.publicKey,
        toPubkey: dataAccount.publicKey,
        lamports: rentExemptAmount + 1000000, // Extra for fees
      })
    )

    await program.provider.sendAndConfirm(transferTx, [signer])

    // Add your test here.
    const tx = await program.methods
      .initialize("Test Initialization")
      .accounts({
        signer: signer.publicKey,
        dataAccount: dataAccount.publicKey,
      })
      .signers([signer, dataAccount])
      .rpc()
    console.log("Your transaction signature", tx)

    const dataAccountInfo = await program.account.pissDrink.fetch(
      dataAccount.publicKey
    )

    console.log("Fart Smeller", dataAccount)
  })
})
