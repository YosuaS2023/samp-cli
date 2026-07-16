import { CstParser } from "chevrotain";
// Impor semua token sebagai namespace T agar rapi, dan allTokens secara eksplisit
import * as T from "../lexer/index.js"; 

export class PawnParser extends CstParser {
    constructor() {
        // Gunakan array allTokens yang sudah Anda buat
        super(T.allTokens); 
        this.performSelfAnalysis();
    }

    public program = this.RULE("program", () => {
        this.MANY(() => {
            this.OR([
                { ALT: () => this.subrule(0, this.declaration) },
                { ALT: () => this.subrule(0, this.arrayAccess) } // Tambahkan ini
            ]);
        });
    });

    public declaration = this.RULE("declaration", () => {
        this.OR([
            { ALT: () => this.CONSUME(T.New) },
            { ALT: () => this.CONSUME(T.Const) },
            { ALT: () => this.CONSUME(T.Stock) },
        ]);
        
        this.CONSUME(T.Identifier);
        
        this.OPTION(() => {
            this.CONSUME(T.LBracket);
            this.CONSUME(T.IntegerLiteral, { LABEL: "size" }); 
            this.CONSUME(T.RBracket);
        });
        
        this.CONSUME(T.Semicolon);
    });

    // PawnParser.ts
    public arrayAccess = this.RULE("arrayAccess", () => {
        this.CONSUME(T.Identifier);
        this.CONSUME(T.LBracket);
        
        // Delegasi ke rule terpisah
        this.subrule(0, this.arrayIndex); 
        
        this.CONSUME(T.RBracket);
        this.CONSUME(T.Assign);
        
        // Delegasi ke rule terpisah
        this.subrule(0, this.arrayValue); 
        
        this.CONSUME(T.Semicolon);
    });

    // Rule khusus untuk indeks
    private arrayIndex = this.RULE("arrayIndex", () => {
        this.CONSUME(T.IntegerLiteral);
    });

    // Rule khusus untuk nilai
    private arrayValue = this.RULE("arrayValue", () => {
        this.CONSUME(T.IntegerLiteral);
    });
}