import { Hashing } from "../../../..";
import { HcsDidEventName } from "./hcs-did-event-name";

export abstract class HcsDidEvent {
    protected abstract readonly name: HcsDidEventName;

    constructor() {}

    abstract toJsonTree(): any;

    abstract toJSON(): string;

    public getBase64() {
        return Hashing.base64.encode(this.toJSON());
    }

    static fromJsonTree(tree: any, result?: HcsDidEvent): HcsDidEvent {
        throw new Error("not implemented");
    }

    public static fromJson(json: string): HcsDidEvent {
        throw new Error("not implemented");
    }
}
