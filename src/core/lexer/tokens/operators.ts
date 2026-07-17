import { createToken } from "chevrotain";

export const Assign = createToken({
    name: "Assign",
    pattern: /=/
});

export const Increment = createToken({
    name: "Increment",
    pattern: /\+\+/
});

export const Plus = createToken({
    name: "Plus",
    pattern: /\+/
});

export const Minus = createToken({
    name: "Minus",
    pattern: /-/
});

export const Multiply = createToken({
    name: "Multiply",
    pattern: /\*/
});

export const Divide = createToken({
    name: "Divide",
    pattern: /\//
});

export const LessThan = createToken({
    name: "LessThan",
    pattern: /</
});