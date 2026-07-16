import { createToken } from "chevrotain";

export const Identifier = createToken({
    name: "Identifier",
    pattern: /[A-Za-z_]\w*/
});