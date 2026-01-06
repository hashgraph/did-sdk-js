import { DidError } from "../../../../did-error";
import { HcsDidEvent } from "../hcs-did-event";
import { HcsDidEventTargetName } from "../hcs-did-event-target-name";

export class HcsDidRevokeVerificationMethodEvent extends HcsDidEvent {
    public readonly targetName = HcsDidEventTargetName.VERIFICATION_METHOD;

    protected id: string;

    constructor(id: string) {
        super();

        if (!id) {
            throw new DidError("Validation failed. Verification Method args are missing");
        }

        if (!this.isKeyEventIdValid(id)) {
            throw new DidError("Event ID is invalid. Expected format: {did}#key-{integer}");
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

    static fromJsonTree(tree: any): HcsDidRevokeVerificationMethodEvent {
        return new HcsDidRevokeVerificationMethodEvent(tree?.id);
    }
}
