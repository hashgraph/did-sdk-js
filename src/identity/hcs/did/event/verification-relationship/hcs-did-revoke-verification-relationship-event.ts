import { HcsDidEvent } from "../hcs-did-event";
import { HcsDidEventName } from "../hcs-did-event-name";
import { VerificationRelationshipType } from "./types";

export class HcsDidRevokeVerificationRelationshipEvent extends HcsDidEvent {
    public readonly name = HcsDidEventName.VERIFICATION_RELATIONSHIP;

    protected id: string;
    protected relationshipType: VerificationRelationshipType;

    constructor(id: string, relationshipType: VerificationRelationshipType) {
        super();

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
            [this.name]: {
                id: this.getId(),
                relationshipType: this.getRelationshipType(),
            },
        };
    }

    public toJSON() {
        return JSON.stringify(this.toJsonTree());
    }

    static fromJsonTree(tree: any): HcsDidRevokeVerificationRelationshipEvent {
        return new HcsDidRevokeVerificationRelationshipEvent(tree.id, tree.relationshipType);
    }
}
