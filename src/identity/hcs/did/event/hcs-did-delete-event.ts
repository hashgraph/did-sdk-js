import { HcsDidEvent } from "./hcs-did-event";
import { HcsDidEventName } from "./hcs-did-event-name";

export class HcsDidDeleteEvent extends HcsDidEvent {
    public readonly name = HcsDidEventName.DELETE;

    constructor() {
        super();
    }

    getId(): string {
        return undefined;
    }

    public toJsonTree() {
        return {
            [this.name]: {},
        };
    }

    public toJSON() {
        return JSON.stringify(this.toJsonTree());
    }

    static fromJsonTree(tree: any): HcsDidDeleteEvent {
        return new HcsDidDeleteEvent();
    }
}
