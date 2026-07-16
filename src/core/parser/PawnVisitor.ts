import { PawnParser } from "./PawnParser.js";
// import { SymbolTable } from "../analyzer/SymbolTable.js"; 

const parser = new PawnParser();
const BaseVisitor = parser.getBaseCstVisitorConstructor();

export class PawnVisitor extends BaseVisitor {
    private symbolTable: Map<string, { size: number }> = new Map();
    
    constructor() {
        super();
        // this.symbolTable = new SymbolTable();
        this.validateVisitor();
    }

    program(ctx: any) {
        // Menggabungkan hasil dari declaration dan arrayAccess
        const declarations = ctx.declaration?.map((d: any) => this.visit(d)) || [];
        const accesses = ctx.arrayAccess?.map((a: any) => this.visit(a)) || [];
        return [...declarations, ...accesses];
    }
    
    declaration(ctx: any) {
        const name = ctx.Identifier[0].image;
        const size = ctx.size ? parseInt(ctx.size[0].image) : 0;

        this.symbolTable.set(name, { size });

        return {
            type: "Declaration",
            name: ctx.Identifier[0].image,
            size: ctx.size ? ctx.size[0].image : null
        };
    }
    
    arrayAccess(ctx: any) {
        const name = ctx.Identifier[0].image;
        const index = parseInt(ctx.arrayIndex[0].children.IntegerLiteral[0].image);
        
        if (!this.symbolTable.has(name)) {
            throw new Error(`Keamanan: Variabel '${name}' belum dideklarasikan!`);
        }

        const meta = this.symbolTable.get(name);
        if (meta && index >= meta.size) {
            console.error(`[SECURITY ALERT] Buffer Overflow pada '${name}'!`);
            console.error(`Indeks ${index} melebihi ukuran deklarasi ${meta.size}`);
        }

        return {
            type: "ArrayAccess",
            name: ctx.Identifier[0].image,
            index: ctx.arrayIndex[0].children.IntegerLiteral[0].image,
            value: ctx.arrayValue[0].children.IntegerLiteral[0].image
        };
    }
    
    arrayIndex(ctx: any) {
        // Karena ini subrule, kita kembalikan saja nilai tokennya
        return ctx.IntegerLiteral[0].image;
    }

    arrayValue(ctx: any) {
        // Karena ini subrule, kita kembalikan saja nilai tokennya
        return ctx.IntegerLiteral[0].image;
    }
}