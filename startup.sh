#!/bin/bash

export PATH=./target/debug/:$PATH
export PATH=./target/release/:$PATH

cargo build --release
cargo run --release --bin zavrsni_web