import { DidDocumentBase, Hashing } from "../../../..";
import { HcsDidEventName } from "./hcs-did-event-name";

export abstract class HcsDidEvent {
    protected abstract readonly name: HcsDidEventName;

    constructor() {}

    abstract toJsonTree(): any;

    abstract toJSON(): string;

    abstract process(didDoc: DidDocumentBase): DidDocumentBase;

    public getBase64() {
        return Hashing.base64.encode(this.toJSON());
    }

    static fromJSONTree(tree: any): HcsDidEvent {
        throw new Error("not implemented");
    }
}
