import { DidError } from "../../../../did-error";
import { HcsDidEvent } from "../hcs-did-event";
import { HcsDidEventTargetName } from "../hcs-did-event-target-name";

export class HcsDidRevokeServiceEvent extends HcsDidEvent {
    public readonly targetName = HcsDidEventTargetName.SERVICE;

    protected id: string;

    constructor(id: string) {
        super();

        if (!id) {
            throw new DidError("Validation failed. Services args are missing");
        }

        if (!this.isServiceEventIdValid(id)) {
            throw new DidError("Event ID is invalid. Expected format: {did}#service-{integer}");
        }

        this.id = id;
    }

    public getId() {
        return this.id;
    }

    public toJsonTree() {
        return {
            [this.targetName]: {
                id: this.getId(),
            },
        };
    }

    public toJSON() {
        return JSON.stringify(this.toJsonTree());
    }

    static fromJsonTree(tree: any): HcsDidRevokeServiceEvent {
        return new HcsDidRevokeServiceEvent(tree?.id);
    }
}
