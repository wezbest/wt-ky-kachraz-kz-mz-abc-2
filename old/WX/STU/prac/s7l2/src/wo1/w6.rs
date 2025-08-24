// ----------------------------------------------------
// Error handling
// ----------------------------------------------------

// --- Attributes ---
#![allow(dead_code)]
#![allow(unused_imports)]

// --- Imports ---
use crate::utz::{header, pswg};
use yansi::Paint;

// --- Main function Call

pub fn wo6_main() {
    let maint1 = "wo5.rs - Errors";
    pswg(maint1);
    find_char_func();
}

// --- Sub Functions

/*
Errors being defined with traits and structs
*/

fn divide(a: f64, b: f64) -> Result<f64, String> {
    if b == 0.0 {
        Err("bastard raped ".red().to_string())
    } else {
        Ok(a / b)
    }
}

fn divide_func() {
    header("Division Function with Error Handling");

    // Success case
    let result1 = divide(10.0, 2.0);
    match result1 {
        Ok(value) => println!("Result: {}", value), // Prints: Result: 5.0
        Err(error) => println!("Error: {}", error),
    }

    // Error case
    let result2 = divide(10.0, 0.0);
    match result2 {
        Ok(value) => println!("Result: {}", value),
        Err(error) => println!("Error: {}", error), // Prints: Error: Cannot divide by zero
    }
}

// Testing error handling with Option

fn find_char(s: &str, c: char) -> Option<usize> {
    for (i, ch) in s.chars().enumerate() {
        if ch == c {
            return Some(i);
        }
    }
    None
}
fn find_char_func() {
    header("Find Character Function with Option");

    // Success case
    let result1 = find_char("hello", 'e');
    match result1 {
        Some(index) => println!("Character found at index: {}", index), // Prints: Character found at index: 1
        None => println!("Character not found"),
    }

    // Error case
    let result2 = find_char("hello", 'x');
    match result2 {
        Some(index) => println!("Character found at index: {}", index),
        None => println!("Character not found"), // Prints: Character not found
    }
}
