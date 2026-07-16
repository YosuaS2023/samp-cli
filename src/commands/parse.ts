import { parse } from "../core/parser/index.js";
import { PawnVisitor } from "../core/parser/PawnVisitor.js";

export const parseTest = () => {
    const source = "new myVar;";
    const { cst } = parse(source); // Pastikan fungsi parse Anda mengembalikan cst

    const visitor = new PawnVisitor();
    const ast = visitor.visit(cst);

    console.log(ast);
}