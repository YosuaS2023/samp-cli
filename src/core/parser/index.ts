import { PawnLexer } from "../lexer/index.js";
import { PawnParser } from "../parser/PawnParser.js";

const parser = new PawnParser();

export function parse(source: string) {
    const lexResult = PawnLexer.tokenize(source);
    
    parser.input = lexResult.tokens;

    const cst = parser.program();

    return {
        cst: cst,
        lexErrors: lexResult.errors,
        parseErrors: parser.errors // Mengembalikan error jika ada
    };
}