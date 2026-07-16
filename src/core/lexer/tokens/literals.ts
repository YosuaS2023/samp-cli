import { createToken } from "chevrotain";

export const IntegerLiteral = createToken({
    name: "IntegerLiteral",
    pattern: /\d+/
});

export const FloatLiteral = createToken({
    name: "FloatLiteral",
    pattern: /\d+\.\d+/
});

export const StringLiteral = createToken({
    name: "StringLiteral",
    pattern: /"(?:[^"\\]|\\.)*"/
});