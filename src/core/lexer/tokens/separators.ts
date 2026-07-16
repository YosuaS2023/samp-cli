import { createToken } from "chevrotain";

export const LParen = createToken({
    name: "LParen",
    pattern: /\(/
});

export const RParen = createToken({
    name: "RParen",
    pattern: /\)/
});

export const LBrace = createToken({
    name: "LBrace",
    pattern: /\{/
});

export const RBrace = createToken({
    name: "RBrace",
    pattern: /\}/
});

export const LBracket = createToken({
    name: "LBracket",
    pattern: /\[/
});

export const RBracket = createToken({
    name: "RBracket",
    pattern: /\]/
});

export const Semicolon = createToken({
    name: "Semicolon",
    pattern: /;/
});

export const Comma = createToken({
    name: "Comma",
    pattern: /,/
});