import { HcsDidEvent } from "./hcs-did-event";
import { HcsDidEventName } from "./hcs-did-event-name";

export class HcsDidDeleteEvent extends HcsDidEvent {
    public readonly name = HcsDidEventName.DELETE;

    /**
     * TODO: are there any restrictions on type?
     */
    constructor() {
        super();
    }

    getId(): string {
        throw new Error("Method not implemented.");
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
