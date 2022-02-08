import { HcsDidEvent } from "./hcs-did-event";
import { HcsDidEventName } from "./hcs-did-event-name";

export class HcsDidDeleteEvent extends HcsDidEvent {
    public readonly name = HcsDidEventName.DID;

    constructor() {
        super();
    }

    getId(): string {
        return undefined;
    }

    public toJsonTree() {
        return null;
    }

    public toJSON() {
        return JSON.stringify(this.toJsonTree());
    }

    public getBase64() {
        return null;
    }

    static fromJsonTree(tree: any): HcsDidDeleteEvent {
        return new HcsDidDeleteEvent();
    }
}
