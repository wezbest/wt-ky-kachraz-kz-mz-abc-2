//-------------------------------------------------------------------------------
use crate::errors::VaultError;
use crate::events::DepositEvent;
use crate::state::Vault;
///
/// TASK: Implement the deposit functionality for the on-chain vault
///
/// Requirements:
/// - Verify that the user has enough balance to deposit
/// - Verify that the vault is not locked
/// - Transfer lamports from user to vault using CPI (Cross-Program Invocation)
/// - Emit a deposit event after successful transfer
///
///-------------------------------------------------------------------------------
use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke;
use anchor_lang::solana_program::system_instruction::transfer;

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn _deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
    // Verify vault is not locked
    require!(!ctx.accounts.vault.locked, VaultError::VaultLocked);

    // Verify user has enough balance
    require!(
        ctx.accounts.user.to_account_info().lamports() >= amount,
        VaultError::InsufficientBalance
    );

    // Transfer lamports from user to vault using CPI
    invoke(
        &transfer(
            ctx.accounts.user.key,
            ctx.accounts.vault.to_account_info().key,
            amount,
        ),
        &[
            ctx.accounts.user.to_account_info(),
            ctx.accounts.vault.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    )?;

    // Emit deposit event
    emit!(DepositEvent {
        amount,
        user: ctx.accounts.user.key(),
        vault: ctx.accounts.vault.key(),
    });

    Ok(())
}
