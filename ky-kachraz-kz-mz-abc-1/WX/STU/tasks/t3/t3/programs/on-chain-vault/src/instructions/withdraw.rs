//-------------------------------------------------------------------------------
use crate::errors::VaultError;
use crate::events::WithdrawEvent;
use crate::state::Vault;
///
/// TASK: Implement the withdraw functionality for the on-chain vault
///
/// Requirements:
/// - Verify that the vault is not locked
/// - Verify that the vault has enough balance to withdraw
/// - Transfer lamports from vault to vault authority
/// - Emit a withdraw event after successful transfer
///
///-------------------------------------------------------------------------------
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub vault: Account<'info, Vault>,
    /// CHECK: Safe to use since we only transfer lamports from this account
    #[account(mut)]
    pub vault_authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn _withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
    // Verify the vault is not locked
    require!(!ctx.accounts.vault.locked, VaultError::VaultLocked);

    // Verify that the signer is the vault authority
    require!(
        ctx.accounts.vault_authority.key() == ctx.accounts.vault.vault_authority,
        VaultError::Unauthorized
    );

    // Verify vault has enough balance
    require!(
        ctx.accounts.vault.to_account_info().lamports() >= amount,
        VaultError::InsufficientBalance
    );

    // Transfer lamports from vault to vault authority
    **ctx
        .accounts
        .vault
        .to_account_info()
        .try_borrow_mut_lamports()? = ctx
        .accounts
        .vault
        .to_account_info()
        .lamports()
        .checked_sub(amount)
        .ok_or(VaultError::Overflow)?;

    **ctx
        .accounts
        .vault_authority
        .to_account_info()
        .try_borrow_mut_lamports()? = ctx
        .accounts
        .vault_authority
        .to_account_info()
        .lamports()
        .checked_add(amount)
        .ok_or(VaultError::Overflow)?;

    // Emit withdraw event
    emit!(WithdrawEvent {
        amount,
        vault_authority: ctx.accounts.vault_authority.key(),
        vault: ctx.accounts.vault.key(),
    });

    Ok(())
}
