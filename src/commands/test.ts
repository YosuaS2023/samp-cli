import { PawnLexer } from "../core/lexer/index.js";
import { PawnParser } from "../core/parser/PawnParser.js";
import { PawnVisitor } from "../core/parser/PawnVisitor.js";

export const runTest = (source: string) => {
    // 1. Lexing
    const lexResult = PawnLexer.tokenize(source);
    if (lexResult.errors.length > 0) {
        console.error("Lexer Errors:", lexResult.errors);
        return;
    }
    
    // 2. Parsing
    const parser = new PawnParser();
    parser.input = lexResult.tokens;
    const cst = parser.program();
    
    if (parser.errors.length > 0) {
        console.error("Parser Errors:", parser.errors);
        return;
    }

    console.log("CST yang dihasilkan:", JSON.stringify(cst, null, 2));

    // 3. Visiting
    const visitor = new PawnVisitor();
    const result = visitor.visit(cst);
    console.log("Hasil Visitor:", result);
}