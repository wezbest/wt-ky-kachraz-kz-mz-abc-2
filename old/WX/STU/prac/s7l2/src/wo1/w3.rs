// ----------------------------------------------------
// Structures and Enums data Types
// Ownership Stuff
// ----------------------------------------------------

// --- Attributes ---
#![allow(dead_code)]
#![allow(unused_imports)]
#![allow(unused_variables)]

// --- Imports ---
use crate::utz::{header, pswg};
use yansi::Paint;

// --- Main function Call

pub fn wo3_main() {
    let maint1 = "wo3.rs - Ownerships";
    pswg(maint1);
    // error1();
    ref_bor();
}

// --- Sub functions Call

/*
This function will deliberately show the ownership error
*/

fn error1() {
    header("Ownership Error Test");

    let s3 = String::from("Smel Farts");
    let s4 = s3;
    // dbg!(&s4);
    println!("Inside Panty: {}", s4);
}

/*
Referencing and borrowing
*/

// Fn to calculate length of string
fn ref_bor() {
    header("Referncing and Borrowing");

    // fn to calculate length of string
    fn calculate_length(s: &String) -> usize {
        s.len() // length of the string
    }

    let s1 = String::from("Sniff");
    let len = calculate_length(&s1);

    fn change(s: &mut String) {
        // Mutable reference
        s.push_str(", Pussy");
    }

    let mut s = String::from("Smell");
    change(&mut s);

    dbg!(s);
}
