import { HcsDidEvent } from "../hcs-did-event";
import { HcsDidEventName } from "../hcs-did-event-name";

export class HcsDidRevokeServiceEvent extends HcsDidEvent {
    public readonly name = HcsDidEventName.SERVICE;

    protected id: string;

    constructor(id: string) {
        super();

        this.id = id;
    }

    public getId() {
        return this.id;
    }

    public toJsonTree() {
        return {
            [this.name]: {
                id: this.getId(),
            },
        };
    }

    public toJSON() {
        return JSON.stringify(this.toJsonTree());
    }

    static fromJsonTree(tree: any): HcsDidRevokeServiceEvent {
        return new HcsDidRevokeServiceEvent(tree.id);
    }
}
