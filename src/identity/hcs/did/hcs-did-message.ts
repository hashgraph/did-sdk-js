import { Timestamp, TopicId } from "@hashgraph/sdk";
import { DidMethodOperation } from "../../did-method-operation";
import { DidParser } from "../../did-parser";
import { Message } from "../message";
import { HcsDidEvent } from "./event/hcs-did-event";
import { HcsDidEventParser } from "./event/hcs-did-event-parser";
import { HcsDid } from "./hcs-did";

/**
 * The DID document message submitted to appnet's DID Topic.
 */
export class HcsDidMessage extends Message {
    protected operation: DidMethodOperation;
    protected did: string;
    protected event: HcsDidEvent;
    /**
     * The date when the DID was created and published.
     * It is equal to consensus timestamp of the first creation message.
     * This property is set by the listener and injected into the DID document upon calling getDidDocument() method.
     */

    protected created: Timestamp;
    /**
     * The date when the DID was updated and published.
     * It is equal to consensus timestamp of the last valid update or delete message.
     * This property is set by the listener and injected into the DID document upon calling getDidDocument() method.
     */
    protected updated: Timestamp;

    /**
     * Creates a new instance of {@link HcsDidMessage}.
     *
     * @param operation         The operation on DID document.
     * @param did               The DID string.
     * @param event The DID Event.
     */
    constructor(operation: DidMethodOperation, did: string, event: HcsDidEvent) {
        super();

        this.operation = operation;
        this.did = did;
        this.event = event;
    }

    public getOperation(): DidMethodOperation {
        return this.operation;
    }

    public getDid(): string {
        return this.did;
    }

    public getEvent(): HcsDidEvent {
        return this.event;
    }

    public getEventBase64() {
        return this.getEvent().getBase64();
    }

    public getCreated(): Timestamp {
        return this.created;
    }

    public getUpdated(): Timestamp {
        return this.updated;
    }

    public setUpdated(updated: Timestamp): void {
        this.updated = updated;
    }

    public setCreated(created: Timestamp): void {
        this.created = created;
    }

    /**
     * Validates this DID message by checking its completeness, signature and DID document.
     *
     * @return True if the message is valid, false otherwise.
     */
    public isValid(): boolean;
    /**
     * Validates this DID message by checking its completeness, signature and DID document.
     *
     * @param didTopicId The DID topic ID against which the message is validated.
     * @return True if the message is valid, false otherwise.
     */
    public isValid(didTopicId: TopicId): boolean;
    public isValid(...args: any[]): boolean {
        const didTopicId: TopicId = args[0] || null;

        if (this.did == null || this.event == null || this.operation == null) {
            return false;
        }

        /**
         * TODO: review this logic and update accoridingly
         */

        try {
            // const doc: DidDocumentBase = DidDocumentBase.fromJson(this.getDidDocument());

            // // Validate if DID and DID document are present and match
            // if (this.did != doc.getId()) {
            //     return false;
            // }

            // // Validate if DID root key is present in the document
            // if (doc.getDidRootKey() == null || doc.getDidRootKey().getPublicKeyMultibase() == null) {
            //     return false;
            // }

            // // Verify that DID was derived from this DID root key

            const hcsDid: HcsDid = DidParser.parse(this.did);

            // // Extract public key from the DID document
            // const publicKeyBytes: Uint8Array = Hashing.multibase.decode(doc.getDidRootKey().getPublicKeyMultibase());
            // const publicKey: PublicKey = PublicKey.fromBytes(publicKeyBytes);

            // if (HcsDid.publicKeyToIdString(publicKey) != hcsDid.getIdString()) {
            //     return false;
            // }

            // Verify that the message was sent to the right topic, if the DID contains the topic
            if (!!didTopicId && !!hcsDid.getTopicId() && didTopicId.toString() != hcsDid.getTopicId().toString()) {
                return false;
            }
        } catch (e) {
            return false;
        }

        return true;
    }

    public toJsonTree(): any {
        const result: any = super.toJsonTree();
        result.operation = this.operation;
        result.did = this.did;
        result.event = this.getEventBase64();
        return result;
    }

    public static fromJsonTree(tree: any, result?: HcsDidMessage): HcsDidMessage {
        const event = HcsDidEventParser.fromBase64(tree.operation, tree.event);

        if (!result) {
            result = new HcsDidMessage(tree.operation, tree.did, event);
        } else {
            result.operation = tree.operation;
            result.did = tree.did;
            result.event = event;
        }
        result = super.fromJsonTree(tree, result) as HcsDidMessage;
        return result;
    }

    public toJSON(): string {
        return JSON.stringify(this.toJsonTree());
    }

    public static fromJson(json: string): Message {
        return Message.fromJsonTree(JSON.parse(json));
    }
}
