//-------------------------------------------------------------------------------
///
/// TASK: Implement the remove comment functionality for the Twitter program
///
/// Requirements:
/// - Close the comment account and return rent to comment author
///
/// NOTE: No implementation logic is needed in the function body - this
/// functionality is achieved entirely through account constraints!
///
///-------------------------------------------------------------------------------
use anchor_lang::prelude::*;

use crate::states::*;

/// NOTE: No logic needed; account constraints enforce behavior.
pub fn remove_comment(_ctx: Context<RemoveCommentContext>) -> Result<()> {
    Ok(())
}

#[derive(Accounts)]
pub struct RemoveCommentContext<'info> {
    #[account(mut)]
    pub comment_author: Signer<'info>,

    // Note: tests do NOT pass `tweet` for commentRemove(), so we must not require it here.
    // Authorization is enforced via has_one = comment_author and PDA derivation at creation time.
    #[account(
        mut,
        has_one = comment_author,
        close = comment_author
    )]
    pub comment: Account<'info, Comment>,
}
