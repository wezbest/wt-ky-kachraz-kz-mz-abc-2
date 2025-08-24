// ----------------------------------------------------
// Life Times
// ----------------------------------------------------

// --- Attributes ---
#![allow(dead_code)]
#![allow(unused_imports)]

// --- Imports ---
use crate::utz::{header, pswg};
use yansi::Paint;

// --- Main function Call

pub fn wo5_main() {
    let maint1 = "wo4.rs - Traits";
    pswg(maint1);
}

// --- Sub Functions ---

// ---Sub Functions---

/*
Life-Times test
*/

fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}

fn lft() {
    let string1 = String::from(" Long String is Panty");
    let result;
    {
        let string2 = String::from("Short");
        result = longest(string1.as_str(), string2.as_str());
        println!("Longest String is: {}", result);
    }
}
