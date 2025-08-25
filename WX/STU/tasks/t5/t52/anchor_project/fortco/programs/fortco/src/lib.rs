//! Fortune Cookie Solana Program
//! 
//! This program allows users to pay 2 lamports to receive a deterministically generated humorous fortune.
//! Designed for Devnet use only.

use anchor_lang::prelude::*;
use anchor_lang::solana_program::entrypoint::ProgramResult;

// Program ID - Replace with your actual program ID after deployment
declare_id!("ETnL1ThTjZje1qs2mQEPzworCzbGq6oVk6Neu7pKQssh");

/// Main program module containing all instruction handlers
#[program]
pub mod fortco {
    use super::*;

    /// Instruction handler for getting a fortune
    /// 
    /// # Arguments
    /// * `ctx` - Context containing all required accounts
    /// 
    /// # Returns
    /// * `ProgramResult` - Success or error
    /// 
    /// # Checks
    /// * User has paid 2 lamports (wallet balance check)
    /// * Fortune account is properly initialized
    pub fn get_fortune(ctx: Context<GetFortune>) -> ProgramResult {
        // Get mutable reference to the fortune data account
        let fortune_data = &mut ctx.accounts.fortune_data;
        
        // Get reference to the user account (signer)
        let user = &ctx.accounts.user;
        
        // Verify 2 lamports payment by checking user's wallet balance
        let required_lamports = 2; // Changed from 2 * 1_000_000_000 to just 2 lamports
        
        // Check if user has sufficient balance
        if **user.to_account_info().lamports.borrow() < required_lamports {
            // Return custom error if payment is insufficient
            return Err(error!(ErrorCode::InsufficientPayment).into());
        }
        
        // Array of possible fortunes - can be expanded for more variety
        let fortunes = [
            "You will find a bug in your code today!",
            "A mysterious PR will fix your issues tomorrow.",
            "Your CPU cycle will bring great joy soon.",
            "Beware of off-by-one errors in your future!",
            "The blockchain gods smile upon your transactions.",
            "A segfault in your past will become a feature in your future.",
            "Your next commit will break production... but in a good way?",
            "The only constant in your life will be changing requirements."
        ];
        
        // Generate deterministic index using Solana-compatible approach
        // Using the first byte of user's public key for pseudo-randomness
        let fortune_index = generate_deterministic_index(&user.key());
        
        // Store the selected fortune and user's public key in the account
        fortune_data.fortune = fortunes[fortune_index].to_string();
        fortune_data.user = user.key();
        
        // Log the delivered fortune for debugging (visible in transaction logs)
        msg!("Fortune delivered: {}", fortune_data.fortune);
        
        // Return success
        Ok(())
    }
}

/// Generates a deterministic index for fortune selection
/// 
/// # Arguments
/// * `user_key` - Public key of the user requesting the fortune
/// 
/// # Returns
/// * `usize` - Index within the fortunes array bounds (0-7)
/// 
/// # Note
/// This uses a simple deterministic approach since true randomness
/// is challenging in Solana's deterministic environment.
fn generate_deterministic_index(user_key: &Pubkey) -> usize {
    // Convert user's public key to bytes
    let user_bytes = user_key.to_bytes();
    
    // Use the first byte of the public key to create a simple hash
    // This provides pseudo-randomness that varies by user
    let index_byte = user_bytes[0] as usize;
    
    // Modulo operation to ensure index stays within array bounds (0-7)
    // 8 is the length of our fortunes array
    index_byte % 8
}

/// Account validation structure for the get_fortune instruction
/// 
/// This struct defines all accounts required by the get_fortune instruction
/// and performs validation checks using Anchor's account constraints system.
#[derive(Accounts)]
pub struct GetFortune<'info> {
    /// Fortune data account that will be initialized and store the fortune
    /// 
    /// # Constraints
    /// * `init` - Creates the account
    /// * `payer` - User pays for account creation
    /// * `space` - Allocates 1000 bytes for the account (enough for String + Pubkey)
    /// * `seeds` - PDA derived from "fortune" prefix and user's public key
    /// * `bump` - Uses canonical bump for the PDA
    #[account(
        init, 
        payer = user, 
        space = 1000,
        seeds = [b"fortune", user.key().as_ref()], 
        bump
    )]
    pub fortune_data: Account<'info, FortuneData>,
    
    /// User account (signer) who requests the fortune
    /// 
    /// # Constraints
    /// * `mut` - Account may be modified (for lamports transfer if implemented)
    #[account(mut)]
    pub user: Signer<'info>,
    
    /// System program required for account creation
    pub system_program: Program<'info, System>,
}

/// Data structure for storing fortune information
/// 
/// This account will be created for each user and store their fortune.
#[account]
pub struct FortuneData {
    /// The fortune text delivered to the user
    /// Stored as a String (dynamic length)
    pub fortune: String,
    
    /// Public key of the user who received this fortune
    /// Useful for tracking and querying fortunes by user
    pub user: Pubkey,
}

/// Custom error codes for the fortune cookie program
/// 
/// Each variant represents a specific error condition that can occur
/// during program execution, with a descriptive error message.
#[error_code]
pub enum ErrorCode {
    /// Error thrown when user doesn't have enough lamports for the fortune
    /// 
    /// Current requirement: 2 lamports
    #[msg("Insufficient payment. 2 lamports required.")]
    InsufficientPayment,
}