import type { IToken } from "chevrotain";
import { PawnParser } from "./parser/PawnParser.js";

const parser = new PawnParser();

export function parse(tokens: IToken[]) {
    parser.input = tokens;

    const cst = parser.program();

    return {
        cst,
        errors: parser.errors
    };
}