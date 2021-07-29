import {DidDocumentBase} from "./did-document-base";
import {DidSyntax} from "./did-syntax";

export interface HederaDid {
    // fromString(string): HederaDid;
    toDid(): string;
    generateDidDocument(): DidDocumentBase;
    getNetwork(): string;
    getMethod(): DidSyntax.Method
}
