import { Hashing } from "../../../..";
import { HcsDidEventName } from "./hcs-did-event-name";

export abstract class HcsDidEvent {
    public abstract readonly name: HcsDidEventName;

    constructor() {}

    abstract getId(): string;

    abstract toJsonTree(): any;

    abstract toJSON(): string;

    public getBase64() {
        return Hashing.base64.encode(this.toJSON());
    }

    static fromJSONTree(tree: any): HcsDidEvent {
        throw new Error("not implemented");
    }
}
