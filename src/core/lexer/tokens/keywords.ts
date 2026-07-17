import { createToken } from "chevrotain";
import { Identifier } from "./identifiers.js";

export const New = createToken({
    name: "New",
    pattern: /new/
});

export const Const = createToken({
    name: "Const",
    pattern: /const/
});

export const Stock = createToken({
    name: "Stock",
    pattern: /stock/
});

export const Public = createToken({
    name: "Public",
    pattern: /public/
});

export const Forward = createToken({
    name: "Forward",
    pattern: /forward/
});

export const For = createToken({
    name: "For",
    pattern: /for\b/,
    longer_alt: Identifier
});