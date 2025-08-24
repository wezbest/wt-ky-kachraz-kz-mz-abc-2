//-------------------------------------------------------------------------------
use crate::errors::VaultError;
use crate::events::ToggleLockEvent;
use crate::state::Vault;
///
/// TASK: Implement the toggle lock functionality for the on-chain vault
///
/// Requirements:
/// - Toggle the locked state of the vault (locked becomes unlocked, unlocked becomes locked)
/// - Only the vault authority should be able to toggle the lock
/// - Emit a toggle lock event after successful state change
///
///-------------------------------------------------------------------------------
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct ToggleLock<'info> {
    #[account(mut)]
    pub vault: Account<'info, Vault>,
    #[account(
        constraint = vault_authority.key() == vault.vault_authority @ VaultError::Unauthorized
    )]
    pub vault_authority: Signer<'info>,
}

pub fn _toggle_lock(ctx: Context<ToggleLock>) -> Result<()> {
    // Toggle the locked state
    ctx.accounts.vault.locked = !ctx.accounts.vault.locked;

    // Emit toggle lock event
    emit!(ToggleLockEvent {
        vault: ctx.accounts.vault.key(),
        vault_authority: ctx.accounts.vault_authority.key(),
        locked: ctx.accounts.vault.locked,
    });

    Ok(())
}
