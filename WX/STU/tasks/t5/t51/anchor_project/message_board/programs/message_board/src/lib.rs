use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

// Replace this with your actual program ID after deploy
declare_id!("3rVuwnGeRCMWK8skXBxRptWGDGVdKPAYJS9yiDp4L4H6");

#[program]
pub mod message_board {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        ctx.accounts.counter.count = 0;
        msg!("✅ Message board initialized! 69 lamports to post.");
        Ok(())
    }

    pub fn post_message(ctx: Context<PostMessage>, content: String) -> Result<()> {
        require!(content.len() <= 100, ErrorCode::ContentTooLong);

        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.payer.to_account_info(),
                to: ctx.accounts.treasury.to_account_info(),
            },
        );
        transfer(cpi_context, 69)?; // Pay 69 lamports

        ctx.accounts.message.content = content;
        ctx.accounts.message.timestamp = Clock::get()?.unix_timestamp;
        ctx.accounts.message.poster = ctx.accounts.payer.key();
        ctx.accounts.counter.count += 1;

        emit!(MessagePosted {
            poster: ctx.accounts.payer.key(),
            message: ctx.accounts.message.key(),
            timestamp: ctx.accounts.message.timestamp,
        });

        msg!("🔥 Message posted for 69 lamports!");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = payer, space = 8 + 8)]
    pub counter: Account<'info, MessageCounter>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(content: String)]
pub struct PostMessage<'info> {
    #[account(mut)]
    pub treasury: SystemAccount<'info>,

    #[account(
        init,
        payer = payer,
        space = 8 + (4 + 100) + 8 + 32,
        seeds = [b"message", counter.count.to_le_bytes().as_ref()],
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
}
