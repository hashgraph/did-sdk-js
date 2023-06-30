import { DidError } from "../../../../did-error";
import { HcsDidEvent } from "../hcs-did-event";
import { HcsDidEventTargetName } from "../hcs-did-event-target-name";

export class HcsDidCreateDidDocumentEvent extends HcsDidEvent {
    public static DID_DOCUMENT_TYPE = "DIDDocument";

    public readonly targetName = HcsDidEventTargetName.DID_DOCUMENT;

    protected id: string;
    protected type = HcsDidCreateDidDocumentEvent.DID_DOCUMENT_TYPE;
    protected cid: string;
    protected url: string;

    constructor(id: string, cid: string, url?: string) {
        super();

        if (!id || !cid) {
            throw new DidError("Validation failed. DID Document args are missing");
        }

        if (!this.isDidValid(id)) {
            throw new DidError("DID is invalid");
        }

        this.id = id;
        this.cid = cid;
        this.url = url;
    }

    public getId() {
        return this.id;
    }

    public getType() {
        return this.type;
    }

    public getCid() {
        return this.cid;
    }

    public getUrl() {
        return this.url;
    }

    public toJsonTree() {
        return {
            [this.targetName]: {
                id: this.getId(),
                type: this.getType(),
                cid: this.getCid(),
                url: this.getUrl(),
            },
        };
    }

    public toJSON() {
        return JSON.stringify(this.toJsonTree());
    }

    static fromJsonTree(tree: any): HcsDidCreateDidDocumentEvent {
        return new HcsDidCreateDidDocumentEvent(tree?.id, tree?.cid, tree?.url);
    }
}
