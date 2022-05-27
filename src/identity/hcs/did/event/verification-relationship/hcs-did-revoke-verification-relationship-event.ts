import { DidError } from "../../../../did-error";
import { HcsDidEvent } from "../hcs-did-event";
import { HcsDidEventTargetName } from "../hcs-did-event-target-name";
import { VerificationRelationshipType } from "./types";

export class HcsDidRevokeVerificationRelationshipEvent extends HcsDidEvent {
    public readonly targetName = HcsDidEventTargetName.VERIFICATION_RELATIONSHIP;

    protected id: string;
    protected relationshipType: VerificationRelationshipType;

    constructor(id: string, relationshipType: VerificationRelationshipType) {
        super();

        if (!id || !relationshipType) {
            throw new DidError("Validation failed. Verification Relationship args are missing");
        }

        if (!this.isKeyEventIdValid(id)) {
            throw new DidError("Event ID is invalid. Expected format: {did}#key-{integer}");
        }

        this.id = id;
        this.relationshipType = relationshipType;
    }

    public getId() {
        return this.id;
    }

    public getRelationshipType() {
        return this.relationshipType;
    }

    public toJsonTree() {
        return {
            [this.targetName]: {
                id: this.getId(),
                relationshipType: this.getRelationshipType(),
            },
        };
    }

    public toJSON() {
        return JSON.stringify(this.toJsonTree());
    }

    static fromJsonTree(tree: any): HcsDidRevokeVerificationRelationshipEvent {
        return new HcsDidRevokeVerificationRelationshipEvent(tree?.id, tree?.relationshipType);
    }
}
