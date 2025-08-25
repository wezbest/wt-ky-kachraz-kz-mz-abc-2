use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

declare_id!("HU2U9Xeg3CMxjg4PRxNa3TxtVv39UgUie8ZRLZn94f3Y");

#[program]
pub mod message_board {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let counter = &mut ctx.accounts.counter;
        require!(counter.count == 0, ErrorCode::AlreadyInitialized);
        counter.count = 0;
        msg!("✅ Message board initialized! 69 lamports to post.");
        Ok(())
    }

    pub fn post_message(ctx: Context<PostMessage>, content: String) -> Result<()> {
        require!(content.len() <= 100, ErrorCode::ContentTooLong);

        let cpi_program = ctx.accounts.system_program.to_account_info();
        let cpi_accounts = Transfer {
            from: ctx.accounts.payer.to_account_info(),
            to: ctx.accounts.treasury.to_account_info(),
        };

        // ✅ Correct bump usage
        let treasury_bump = *ctx.bumps.get("treasury").unwrap();
        let seeds = &[b"treasury", &[treasury_bump]];
        let signer_seeds = &[&seeds[..]];
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
        transfer(cpi_ctx, 69)?;

        let message = &mut ctx.accounts.message;
        message.content = content;
        message.timestamp = Clock::get()?.unix_timestamp;
        message.poster = ctx.accounts.payer.key();

        let counter = &mut ctx.accounts.counter;
        counter.count = counter
            .count
            .checked_add(1)
            .ok_or(ErrorCode::CounterOverflow)?;

        emit!(MessagePosted {
            poster: ctx.accounts.payer.key(),
            message: message.key(),
            timestamp: message.timestamp,
        });

        msg!("🔥 Message posted for 69 lamports!");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init_if_needed,
        payer = payer,
        space = 8 + 8,
        seeds = [b"counter"],
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
    #[account(
        mut,
        seeds = [b"treasury"],
        bump
    )]
    pub treasury: SystemAccount<'info>,

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

#[event]
pub struct MessagePosted {
    pub poster: Pubkey,
    pub message: Pubkey,
    pub timestamp: i64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Message too long! Max 100 characters.")]
    ContentTooLong,

    #[msg("The message board is already initialized.")]
    AlreadyInitialized,

    #[msg("Message counter overflowed.")]
    CounterOverflow,
}