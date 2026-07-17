import { PawnParser } from "./PawnParser.js";

const parser = new PawnParser();
const BaseVisitor = parser.getBaseCstVisitorConstructor();

export class PawnVisitor extends BaseVisitor {
    private symbolTable: Map<string, { size: number }> = new Map();
    private currentLoopBounds: Map<string, number> = new Map();
    private filePath: string;

    constructor(filePath: string = "unknown_file.pwn") {
        super();
        this.filePath = filePath;
        this.validateVisitor();
    }

    program(ctx: any) {
        const results: any[] = [];
        
        if (ctx.functionDeclaration) {
            ctx.functionDeclaration.forEach((f: any) => results.push(this.visit(f)));
        }
        if (ctx.statement) {
            ctx.statement.forEach((s: any) => results.push(this.visit(s)));
        }
        
        return results;
    }

    functionDeclaration(ctx: any) {
        const blockResult = ctx.block ? this.visit(ctx.block[0]) : null;
        return {
            type: "FunctionDeclaration",
            name: ctx.Identifier[0].image,
            body: blockResult
        };
    }

    block(ctx: any) {
        const statements = ctx.statement?.map((s: any) => this.visit(s)) || [];
        return statements;
    }

    statement(ctx: any) {
        if (ctx.declaration) return this.visit(ctx.declaration[0]);
        if (ctx.forLoop) return this.visit(ctx.forLoop[0]);
        if (ctx.arrayAccess) return this.visit(ctx.arrayAccess[0]);
        return null;
    }
    
    // Menangani deklarasi variabel tunggal atau multi-baris (MANY_SEP)
    declaration(ctx: any) {
        const results: any[] = [];
        const identifiers = ctx.Identifier || [];
        const sizes = ctx.size || []; // Label "size" dari parser

        // Loop sebanyak variabel yang didaftarkan (misal: string[129], abc[2])
        identifiers.forEach((idToken: any, index: number) => {
            const name = idToken.image;
            
            // Cari tahu apakah token ID ke-index ini punya ukuran array di dekatnya
            // Chevrotain menempatkan properti label berurutan di dalam array ctx
            const sizeToken = sizes[index]; 
            const size = sizeToken ? parseInt(sizeToken.image) : 0;

            // Kirim ke SymbolTable
            this.symbolTable.set(name, { size });

            results.push({
                type: "Declaration",
                name: name,
                size: size > 0 ? size : null
            });
        });

        return results;
    }
    
    // Menangani akses & modifikasi nilai array
    arrayAccess(ctx: any) {
        // Ambil token utamanya (Token nama array)
        const arrayToken = ctx.Identifier[0];
        const arrayName = arrayToken.image; // 'abc'
        
        // Ambil baris dan kolom dari token
        const line = arrayToken.startLine;
        const column = arrayToken.startColumn;

        const arrayInfo = this.symbolTable.get(arrayName); 
        if (!arrayInfo) return;

        const arraySize = arrayInfo.size;

        // Cek jika index menggunakan variabel loop (misal: abc[i])
        if (ctx.loopIndex || (ctx.Identifier && ctx.Identifier[1])) {
            const indexToken = ctx.loopIndex ? ctx.loopIndex[0] : ctx.Identifier[1];
            const indexVarName = indexToken.image;

            if (this.currentLoopBounds.has(indexVarName)) {
                const potentialMaxIndex = this.currentLoopBounds.get(indexVarName)!;

                if (potentialMaxIndex > arraySize) {
                    console.log(
                        `\x1b[33m[WARNING]\x1b[0m \x1b[36m${this.filePath}:${line}:${column}\x1b[0m - ` +
                        `Potential Array Out of Bounds on '${arrayName}'! ` +
                        `The array size is only ${arraySize}, but the '${indexVarName}' loop can go up to ${potentialMaxIndex}.`
                    );
                }
            }
        } 

        // Cek jika index langsung berupa angka tetap (misal: abc[5])
        else if (ctx.arrayIndex) {
            const indexLiteralToken = ctx.arrayIndex[0].children.IntegerLiteral[0];
            const directIndex = parseInt(indexLiteralToken.image);
            
            if (directIndex >= arraySize) {
                console.log(
                    `\x1b[31m[ERROR]\x1b[0m \x1b[36m${this.filePath}:${line}:${column}\x1b[0m - ` +
                    `Array Out of Bounds! Accessing index ${directIndex} in the array '${arrayName}' of size ${arraySize}.`
                );
            }
        }
    }
    
    arrayIndex(ctx: any) {
        return ctx.IntegerLiteral[0].image;
    }

    arrayValue(ctx: any) {
        return ctx.IntegerLiteral[0].image;
    }

    // Fungsi untuk loop syntax for

    forLoop(ctx: any) {
        // Ambil nama variabel loop (misal: 'i')
        // ctx.Identifier[0] biasanya adalah inisialisasi awal (new i = 0)
        const loopVarName = ctx.Identifier[0].image;

        // Ambil nilai batas maksimal dari perulangan (misal: 20 dari i < 20)
        // ctx.IntegerLiteral[1] adalah angka kedua yang muncul di statement for
        const maxBound = parseInt(ctx.IntegerLiteral[1].image);

        // Simpan info bahwa variabel 'i' ini memiliki batas maksimal 'maxBound'
        this.currentLoopBounds.set(loopVarName, maxBound);

        // Jalankan/visit isi block di dalam for
        if (ctx.block) {
            this.visit(ctx.block);
        }

        // Setelah keluar dari loop for, hapus data tracker agar tidak bocor ke luar
        this.currentLoopBounds.delete(loopVarName);
    }
}