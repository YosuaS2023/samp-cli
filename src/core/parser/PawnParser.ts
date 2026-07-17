import { CstParser } from "chevrotain";
import * as T from "../lexer/index.js"; 

export class PawnParser extends CstParser {
    constructor() {
        super(T.allTokens); 
        this.performSelfAnalysis();
    }

    public program = this.RULE("program", () => {
        this.MANY(() => {
            this.OR([
                // Cara membedakan akses array dan deklarasi function
                { 
                    GATE: () => this.isFunctionDeclaration(),
                    ALT: () => this.subrule(0, this.functionDeclaration) 
                },
                { 
                    GATE: () => this.isStatement(),
                    ALT: () => this.subrule(0, this.statement) 
                }
            ]);
        });
    });

    // Helper untuk mengecek apakah token berikutnya membentuk fungsi: Identifier lalu '('
    private isFunctionDeclaration(): boolean {
        const nextToken = this.LA(1);
        const nextNextToken = this.LA(2);
        return nextToken.tokenType === T.Identifier && nextNextToken.tokenType === T.LParen;
    }

    // Helper untuk mengecek statement biasa
    private isStatement(): boolean {
        const nextToken = this.LA(1);
        // Jika diawali kata kunci deklarasi atau loop 'for'
        if (nextToken.tokenType === T.New || 
            nextToken.tokenType === T.Const || 
            nextToken.tokenType === T.Stock || 
            nextToken.tokenType === T.For) {
            return true;
        }
        // Jika diawali nama variabel biasa (misal assignment array: abc[1] = 2;)
        if (nextToken.tokenType === T.Identifier) {
            return true;
        }
        return false;
    }

    public functionDeclaration = this.RULE("functionDeclaration", () => {
        this.CONSUME(T.Identifier);
        this.CONSUME(T.LParen);     // '('
        this.CONSUME(T.RParen);     // ')'
        this.subrule(0, this.block); // '{ ... }'
    });

    public block = this.RULE("block", () => {
        this.CONSUME(T.LBrace);     // '{'
        this.MANY(() => {
            this.subrule(0, this.statement);
        });
        this.CONSUME(T.RBrace);     // '}'
    });

    public statement = this.RULE("statement", () => {
        this.OR([
            { ALT: () => this.subrule(0, this.declaration) },
            { ALT: () => this.subrule(0, this.forLoop) },
            { ALT: () => this.subrule(0, this.arrayAccess) }
        ]);
    });

    public declaration = this.RULE("declaration", () => {
        this.OR([
            { ALT: () => this.CONSUME(T.New) },
            { ALT: () => this.CONSUME(T.Const) },
            { ALT: () => this.CONSUME(T.Stock) },
        ]);
        
        this.MANY_SEP({
            SEP: T.Comma,
            DEF: () => {
                this.CONSUME(T.Identifier);
                this.OPTION(() => {
                    this.CONSUME(T.LBracket);
                    this.CONSUME(T.IntegerLiteral, { LABEL: "size" }); 
                    this.CONSUME(T.RBracket);
                });
            }
        });
        
        this.CONSUME(T.Semicolon);
    });

    public arrayAccess = this.RULE("arrayAccess", () => {
        this.CONSUME(T.Identifier);
        this.CONSUME(T.LBracket);
        
        this.OR([
            { ALT: () => this.subrule(0, this.arrayIndex) },
            { ALT: () => this.CONSUME2(T.Identifier, { LABEL: "loopIndex" }) }
        ]);
        
        this.CONSUME(T.RBracket);
        this.CONSUME(T.Assign);
        
        this.subrule(0, this.arrayValue); 
        this.CONSUME(T.Semicolon);
    });

    private arrayIndex = this.RULE("arrayIndex", () => {
        this.CONSUME(T.IntegerLiteral);
    });

    private arrayValue = this.RULE("arrayValue", () => {
        this.CONSUME(T.IntegerLiteral);
    });

    public forLoop = this.RULE("forLoop", () => {
        this.CONSUME(T.For);
        this.CONSUME(T.LParen); 
        
        this.CONSUME(T.New);
        this.CONSUME(T.Identifier);
        this.CONSUME(T.Assign);
        this.CONSUME(T.IntegerLiteral);
        this.CONSUME(T.Semicolon);

        this.CONSUME2(T.Identifier);
        this.CONSUME(T.LessThan);
        this.CONSUME2(T.IntegerLiteral);
        this.CONSUME2(T.Semicolon);

        this.CONSUME3(T.Identifier);
        this.CONSUME(T.Increment); 
        
        this.CONSUME(T.RParen); 
        this.subrule(0, this.block); 
    });
}