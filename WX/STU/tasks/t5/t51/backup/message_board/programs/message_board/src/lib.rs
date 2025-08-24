use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

// 🔁 Replace with your actual program ID after deploy
declare_id!("42Wr5wYojEHWwDFHRfLjyHxLSBQETJZ58XKihcm2Lfcn");

#[program]
pub mod message_board {
    use super::*;

    /// Initialize the message board with a counter at zero.
    /// Can only be called once (idempotent via account existence check).
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        require!(counter.count == 0, ErrorCode::AlreadyInitialized);
        counter.count = 0;

        msg!("✅ Message board initialized! 69 lamports to post.");
        Ok(())
    }

    /// Post a message and pay 69 lamports to the treasury.
    pub fn post_message(ctx: Context<PostMessage>, content: String) -> Result<()> {
        require!(content.len() <= 100, ErrorCode::ContentTooLong);

        // ✅ Transfer 69 lamports to treasury
        let cpi_program = ctx.accounts.system_program.to_account_info();
        let cpi_accounts = Transfer {
            from: ctx.accounts.payer.to_account_info(),
            to: ctx.accounts.treasury.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        transfer(cpi_ctx, 69)?;

        // ✅ Store message
        let message = &mut ctx.accounts.message;
        message.content = content;
        message.timestamp = Clock::get()?.unix_timestamp;
        message.poster = ctx.accounts.payer.key();

        // ✅ Increment counter with overflow check
        let counter = &mut ctx.accounts.counter;
        counter.count = counter
            .count
            .checked_add(1)
            .ok_or(ErrorCode::CounterOverflow)?;

        // ✅ Emit event
        emit!(MessagePosted {
            poster: ctx.accounts.payer.key(),
            message: message.key(),
            timestamp: message.timestamp,
        });

        msg!("🔥 Message posted for 69 lamports!");
        Ok(())
    }
}

// =============================================
//           ACCOUNTS
// =============================================

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init_if_needed, // ✅ Only init if not already created
        payer = payer,
        space = 8 + 8,
        seeds = [b"counter"], // 🔐 Fixed PDA for counter
        bump
    )]
    pub counter: Account<'info, MessageCounter>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(content: String)]
pub struct PostMessage<'info> {
    /// 🛡️ Treasury is a PDA — only this program can own it
    #[account(
        mut,
        seeds = [b"treasury"],
        bump
    )]
    pub treasury: SystemAccount<'info>,

    /// ✅ Message PDA includes counter address to avoid collisions across boards
    #[account(
        init,
        payer = payer,
        space = Message::SPACE,
        seeds = [
            b"message",
            counter.key().as_ref(),
            counter.count.to_le_bytes().as_ref()
        ],
        bump
    )]
    pub message: Account<'info, Message>,

    #[account(mut)]
    pub counter: Account<'info, MessageCounter>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

// =============================================
//           DATA STRUCTS
// =============================================

#[account]
pub struct Message {
    pub content: String,
    pub timestamp: i64,
    pub poster: Pubkey,
}

impl Message {
    pub const MAX_CONTENT: usize = 100;
    pub const SPACE: usize = 8 + (4 + Self::MAX_CONTENT) + 8 + 32;
}

#[account]
pub struct MessageCounter {
    pub count: u64,
}

// =============================================
//           EVENTS
// =============================================

#[event]
pub struct MessagePosted {
    pub poster: Pubkey,
    pub message: Pubkey,
    pub timestamp: i64,
}

// =============================================
//           ERRORS
// =============================================

#[error_code]
pub enum ErrorCode {
    #[msg("Message too long! Max 100 characters.")]
    ContentTooLong,

    #[msg("The message board is already initialized.")]
    AlreadyInitialized,

    #[msg("Message counter overflowed.")]
    CounterOverflow,
}
