import { PawnLexer } from "../lexer/index.js";
import { PawnParser } from "../parser/PawnParser.js";

const parser = new PawnParser();

export function parse(source: string) {
    const lexResult = PawnLexer.tokenize(source);
    
    // Memberikan input tokens ke parser
    parser.input = lexResult.tokens;

    // Memanggil rule utama (program) untuk mendapatkan CST
    const cst = parser.program();

    return {
        cst: cst,              // <-- Ini yang krusial untuk Visitor
        lexErrors: lexResult.errors,
        parseErrors: parser.errors // Mengembalikan error jika ada
    };
}