import { Lexer } from "chevrotain";

import * as T from "./tokens/index.js";

export const allTokens = [
    T.WhiteSpace,

    // keyword
    T.New,
    T.Const,
    T.Stock,
    T.Public,
    T.Forward,
    T.For,

    // operator
    T.LessThan,
    T.Increment,
    T.Assign,
    T.Plus,
    T.Minus,
    T.Multiply,
    T.Divide,

    // separator
    T.LParen,
    T.RParen,
    T.LBrace,
    T.RBrace,
    T.LBracket,
    T.RBracket,
    T.Semicolon,
    T.Comma,

    // literal
    T.FloatLiteral,
    T.IntegerLiteral,
    T.StringLiteral,

    // identifier
    T.Identifier
];

export const PawnLexer = new Lexer(allTokens);

export function lex(source: string) {
    return PawnLexer.tokenize(source);
}