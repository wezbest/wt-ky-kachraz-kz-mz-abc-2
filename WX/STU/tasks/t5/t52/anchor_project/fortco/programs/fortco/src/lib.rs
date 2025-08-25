use anchor_lang::prelude::*;
use anchor_lang::solana_program::entrypoint::ProgramResult;
use rand::Rng;

declare_id!("FORTUNE_PROGRAM_ID");

#[program]
pub mod fortune_cookie {
    use super::*;

    pub fn get_fortune(ctx: Context<GetFortune>) -> ProgramResult {
        let fortune_data = &mut ctx.accounts.fortune_data;
        let user = &ctx.accounts.user;
        
        // Verify 2 SOL payment
        let required_lamports = 2 * 10^9; // 2 SOL in lamports
        if **user.to_account_info().lamports.borrow() < required_lamports {
            return Err(ErrorCode::InsufficientPayment.into());
        }
        
        // Generate random fortune
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
        
        let mut rng = rand::thread_rng();
        let fortune_index = rng.gen_range(0..fortunes.len());
        
        // Store fortune
        fortune_data.fortune = fortunes[fortune_index].to_string();
        fortune_data.user = user.key();
        
        msg!("Fortune delivered: {}", fortune_data.fortune);
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct GetFortune<'info> {
    #[account(
        init, 
        payer = user, 
        space = 1000,
        seeds = [b"fortune", user.key().as_ref()], 
        bump
    )]
    pub fortune_data: Account<'info, FortuneData>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct FortuneData {
    pub fortune: String,
    pub user: Pubkey,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Insufficient payment. 2 SOL required.")]
    InsufficientPayment,
}