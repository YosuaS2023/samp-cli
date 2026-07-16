export interface SymbolInfo {
    name: string;
    size: number; // 0 jika variabel biasa, >0 jika array
    type: string;  // "new", "const", "stock", dll
}

export class SymbolTable {
    private symbols: Map<string, SymbolInfo> = new Map();
    // Referensi ke scope di luarnya (parent scope) untuk pencarian bertingkat
    public parentScope: SymbolTable | null = null;

    constructor(parent: SymbolTable | null = null) {
        this.parentScope = parent;
    }

    // Mendefinisikan variabel baru di scope saat ini
    public define(name: string, info: SymbolInfo): void {
        this.symbols.set(name, info);
    }

    // Mencari variabel secara rekursif naik ke scope induk jika tidak ada di scope lokal
    public lookup(name: string): SymbolInfo | undefined {
        const found = this.symbols.get(name);
        if (found) {
            return found;
        }
        // Jika tidak ketemu di lokal, cari di parent scope (global/enclosing)
        if (this.parentScope) {
            return this.parentScope.lookup(name);
        }
        return undefined;
    }
}