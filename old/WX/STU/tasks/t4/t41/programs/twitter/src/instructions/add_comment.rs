//-------------------------------------------------------------------------------
///
/// TASK: Implement the add comment functionality for the Twitter program
///
/// Requirements:
/// - Validate that comment content doesn't exceed maximum length
/// - Initialize a new comment account with proper PDA seeds
/// - Set comment fields: content, author, parent tweet, and bump
/// - Use content hash in PDA seeds for unique comment identification
///
///-------------------------------------------------------------------------------
use anchor_lang::prelude::*;
use anchor_lang::solana_program::hash::hash as sha256_hash;

use crate::errors::TwitterError;
use crate::states::*;

pub fn add_comment(ctx: Context<AddCommentContext>, comment_content: String) -> Result<()> {
    // Validate comment length BEFORE any PDA init happens (so tests catch CommentTooLong)
    if comment_content.len() > COMMENT_LENGTH {
        return Err(TwitterError::CommentTooLong.into());
    }

    // Set the comment fields
    let comment = &mut ctx.accounts.comment;
    comment.content = comment_content.clone();
    comment.comment_author = ctx.accounts.comment_author.key();
    comment.parent_tweet = ctx.accounts.tweet.key();
    comment.bump = ctx.bumps.comment;

    Ok(())
}

#[derive(Accounts)]
#[instruction(comment_content: String)]
pub struct AddCommentContext<'info> {
    #[account(mut)]
    pub comment_author: Signer<'info>,

    // Tests pass this account as `tweet`
    pub tweet: Account<'info, Tweet>,

    #[account(
        init,
        payer = comment_author,
        // IMPORTANT: Anchor macro expands #[instruction(...)] so that instruction args
        // are in scope for attribute expressions on this Accounts struct.
        // However, to avoid any scope/timing issues seen with direct call usage inside seeds,
        // bind the instruction arg to a local inside the attribute block and then use it.
        seeds = [
            COMMENT_SEED.as_bytes(),
            comment_author.key().as_ref(),
            {
                let cc: &String = &comment_content;
                sha256_hash(cc.as_bytes()).to_bytes().as_ref()
            },
            tweet.key().as_ref()
        ],
        bump,
        space = 8 + Comment::INIT_SPACE
    )]
    pub comment: Account<'info, Comment>,

    pub system_program: Program<'info, System>,
}
