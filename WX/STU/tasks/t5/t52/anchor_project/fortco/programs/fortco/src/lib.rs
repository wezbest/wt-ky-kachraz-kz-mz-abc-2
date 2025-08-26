//! Fortune Cookie Solana Program
//!
//! This program allows users to pay 2 lamports to receive a deterministically generated humorous fortune.
//! Designed for Devnet use only.

use anchor_lang::prelude::*;
use anchor_lang::solana_program::entrypoint::ProgramResult;

// Program ID - Replace with your actual program ID after deployment
declare_id!("8fCRvezhexJsx5Guy77p65rPdPV1bztSjE2a9GTTdFjA");

/// Main program module containing all instruction handlers
#[program]
pub mod fortco {
    use super::*;

    /// Instruction handler for getting a fortune
    ///
    /// # Arguments
    /// * `ctx` - Context containing all required accounts
    /// * `counter` - A unique number per user request to generate distinct PDAs
    ///
    /// # Returns
    /// * `ProgramResult` - Success or error
    ///
    /// # Checks
    /// * User has paid 2 lamports (wallet balance check)
    /// * Fortune account is properly initialized
    pub fn get_fortune(ctx: Context<GetFortune>, counter: u64) -> ProgramResult { // Add counter argument
        let fortune_data = &mut ctx.accounts.fortune_data;
        let user = &ctx.accounts.user;

        // Verify 2 lamports payment by checking user's wallet balance
        let required_lamports = 2;

        // Check if user has sufficient balance
        if **user.to_account_info().lamports.borrow() < required_lamports {
            // Return custom error if payment is insufficient
            return Err(error!(ErrorCode::InsufficientPayment).into());
        }

        // Array of possible fortunes - expanded with super funny ones
        let fortunes = [
            // Original fortunes (8)
            "You will find a bug in your code today!",
            "A mysterious PR will fix your issues tomorrow.",
            "Your CPU cycle will bring great joy soon.",
            "Beware of off-by-one errors in your future!",
            "The blockchain gods smile upon your transactions.",
            "A segfault in your past will become a feature in your future.",
            "Your next commit will break production... but in a good way?",
            "The only constant in your life will be changing requirements.",
            // New super funny fortunes (12)
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

        // Generate deterministic index using Solana-compatible approach
        // Incorporate both user key and counter for uniqueness per request
        let fortune_index = generate_deterministic_index(&user.key(), counter); // Pass counter

        // Store the selected fortune and user's public key in the account
        fortune_data.fortune = fortunes[fortune_index].to_string();
        fortune_data.user = user.key();

        // Log the delivered fortune for debugging (visible in transaction logs)
        msg!("Fortune #{} delivered: {}", counter, fortune_data.fortune);

        // Return success
        Ok(())
    }
}

/// Generates a deterministic index for fortune selection
///
/// # Arguments
/// * `user_key` - Public key of the user requesting the fortune
/// * `counter` - Request counter to ensure uniqueness
///
/// # Returns
/// * `usize` - Index within the fortunes array bounds (0-19)
///
/// # Note
/// Uses a hash of user key and counter modulo the array length.
fn generate_deterministic_index(user_key: &Pubkey, counter: u64) -> usize {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};

    let mut hasher = DefaultHasher::new();
    user_key.hash(&mut hasher);
    counter.hash(&mut hasher); // Include counter in the hash
    let hash = hasher.finish();

    // Modulo operation to ensure index stays within array bounds
    // 20 is the new length of our fortunes array
    (hash % 20) as usize
}

/// Account validation structure for the get_fortune instruction
///
/// This struct defines all accounts required by the get_fortune instruction
/// and performs validation checks using Anchor's account constraints system.
#[derive(Accounts)]
#[instruction(counter: u64)] // Add counter as an instruction argument
pub struct GetFortune<'info> {
    /// Fortune data account that will be initialized and store the fortune
    ///
    /// # Constraints
    /// * `init` - Creates the account
    /// * `payer` - User pays for account creation
    /// * `space` - Allocates 1000 bytes for the account (enough for String + Pubkey)
    /// * `seeds` - PDA derived from "fortune" prefix, user's public key, and request counter
    /// * `bump` - Uses canonical bump for the PDA
    #[account(
        init,
        payer = user,
        space = 1000,
        seeds = [b"fortune", user.key().as_ref(), &counter.to_le_bytes()], // Include counter in seeds
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