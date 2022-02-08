import { HcsDidEvent } from "../hcs-did-event";
import { HcsDidEventTargetName } from "../hcs-did-event-target-name";

export class HcsDidRevokeVerificationMethodEvent extends HcsDidEvent {
    public readonly targetName = HcsDidEventTargetName.VERIFICATION_METHOD;

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
            [this.targetName]: {
                id: this.getId(),
            },
        };
    }

    public toJSON() {
        return JSON.stringify(this.toJsonTree());
    }

    static fromJsonTree(tree: any): HcsDidRevokeVerificationMethodEvent {
        if (!tree.id) {
            throw new Error("Tree data is missing one of the attributes: id");
        }
        return new HcsDidRevokeVerificationMethodEvent(tree.id);
    }
}
