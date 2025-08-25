//! Fortune Cookie Solana Program
//! 
//! This program allows users to pay 2 SOL to receive a randomly generated humorous fortune.
//! Designed for Devnet use only.

use anchor_lang::prelude::*;
use anchor_lang::solana_program::entrypoint::ProgramResult;
use rand::Rng;

// Program ID will be replaced during build/deployment
declare_id!("FORTUNE_PROGRAM_ID");

/// Main program module containing all instruction handlers
#[program]
pub mod fortune_cookie {
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
    /// * User has paid 2 SOL (wallet balance check)
    /// * Fortune account is properly initialized
    pub fn get_fortune(ctx: Context<GetFortune>) -> ProgramResult {
        // Get mutable reference to the fortune data account
        let fortune_data = &mut ctx.accounts.fortune_data;
        
        // Get reference to the user account (signer)
        let user = &ctx.accounts.user;
        
        // Verify 2 SOL payment by checking user's wallet balance
        // Note: 1 SOL = 1,000,000,000 lamports
        let required_lamports = 2 * 1_000_000_000; // 2 SOL in lamports (corrected from 10^9)
        
        // Check if user has sufficient balance
        if **user.to_account_info().lamports.borrow() < required_lamports {
            // Return custom error if payment is insufficient
            return Err(ErrorCode::InsufficientPayment.into());
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
        
        // Create a random number generator
        let mut rng = rand::thread_rng();
        
        // Generate random index within the fortunes array bounds
        let fortune_index = rng.gen_range(0..fortunes.len());
        
        // Store the selected fortune and user's public key in the account
        fortune_data.fortune = fortunes[fortune_index].to_string();
        fortune_data.user = user.key();
        
        // Log the delivered fortune for debugging (visible in transaction logs)
        msg!("Fortune delivered: {}", fortune_data.fortune);
        
        // Return success
        Ok(())
    }
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
    /// * `space` - Allocates 1000 bytes for the account
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
    /// Error thrown when user doesn't have enough SOL for the fortune
    /// 
    /// Current requirement: 2 SOL (2000000000 lamports)
    #[msg("Insufficient payment. 2 SOL required.")]
    InsufficientPayment,
    
    // Note: Additional error codes can be added here as needed:
    // #[msg("Fortune already claimed")]
    // AlreadyClaimed,
    // #[msg("Invalid fortune parameters")]
    // InvalidParameters,
}