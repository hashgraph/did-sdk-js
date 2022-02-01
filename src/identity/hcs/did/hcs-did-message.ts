import { Timestamp, TopicId } from "@hashgraph/sdk";
import { DidMethodOperation } from "../../did-method-operation";
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
     * @param didDocumentBase64 The Base64-encoded DID document.
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

        if (this.did == null || this.event == null) {
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

            const hcsDid: HcsDid = HcsDid.fromString(this.did);

            // // Extract public key from the DID document
            // const publicKeyBytes: Uint8Array = Hashing.multibase.decode(doc.getDidRootKey().getPublicKeyMultibase());
            // const publicKey: PublicKey = PublicKey.fromBytes(publicKeyBytes);

            // if (HcsDid.publicKeyToIdString(publicKey) != hcsDid.getIdString()) {
            //     return false;
            // }

            // Verify that the message was sent to the right topic, if the DID contains the topic
            if (
                !!didTopicId &&
                !!hcsDid.getDidTopicId() &&
                didTopicId.toString() != hcsDid.getDidTopicId().toString()
            ) {
                return false;
            }
        } catch (e) {
            return false;
        }

        return true;
    }

    /**
     * Extracts #did-root-key from the DID document.
     *
     * @return Public key of the DID subject.
     */
    /**
     * TODO: message no longer contains the whole DID document
     */
    // public extractDidRootKey(): PublicKey {
    //     let result: PublicKey = null;
    //     try {
    //         const doc: DidDocumentBase = DidDocumentBase.fromJson(this.getDidDocument());
    //         // Make sure that DID root key is present in the document
    //         if (doc.getDidRootKey() != null && doc.getDidRootKey().getPublicKeyMultibase() != null) {
    //             const publicKeyBytes: Uint8Array = Hashing.multibase.decode(
    //                 doc.getDidRootKey().getPublicKeyMultibase()
    //             );
    //             result = PublicKey.fromBytes(publicKeyBytes);
    //         }
    //         // ArrayIndexOutOfBoundsException is thrown in case public key is invalid in PublicKey.fromBytes
    //     } catch (e) {
    //         return null;
    //     }

    //     return result;
    // }

    public toJsonTree(): any {
        const result: any = super.toJsonTree();
        result.operation = this.operation;
        result.did = this.did;
        result.event = this.getEventBase64();
        return result;
    }

    public static fromJsonTree(tree: any, result?: HcsDidMessage): HcsDidMessage {
        const event = HcsDidEventParser.fromBase64(tree.event);

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

    /**
     * Creates a new DID message for submission to HCS topic.
     *
     * @param didDocumentJson DID document as JSON string.
     * @param operation       The operation on DID document.
     * @return The HCS message wrapped in an envelope for the given DID document and method operation.
     */
    /**
     * TODO: we no longer submit the whole DID document
     */
    // public static fromDidDocumentJson(
    //     didDocumentJson: string,
    //     operation: DidMethodOperation
    // ): MessageEnvelope<HcsDidMessage> {
    //     const didDocumentBase: DidDocumentBase = DidDocumentBase.fromJson(didDocumentJson);
    //     const didDocumentBase64 = Hashing.base64.encode(didDocumentJson);
    //     const message: HcsDidMessage = new HcsDidMessage(operation, didDocumentBase.getId(), didDocumentBase64);
    //     return new MessageEnvelope<HcsDidMessage>(message);
    // }

    /**
     * Provides an encryption operator that converts an {@link HcsDidMessage} into encrypted one.
     *
     * @param encryptionFunction The encryption function to use for encryption of single attributes.
     * @return The encryption operator instance.
     */
    // public static getEncrypter(encryptionFunction: Encrypter<string>): Encrypter<HcsDidMessage> {
    //     if (encryptionFunction == null) {
    //         throw "Encryption function is missing or null.";
    //     }
    //     return function (message: HcsDidMessage): HcsDidMessage {
    //         const operation: DidMethodOperation = message.getOperation();
    //         // Encrypt the DID
    //         const encryptedDid: string = encryptionFunction(message.getDid());
    //         const did: string = Hashing.base64.encode(encryptedDid);
    //         // Encrypt the DID document
    //         const encryptedDoc: string = encryptionFunction(message.getDidDocumentBase64());
    //         const didDocumentBase64: string = Hashing.base64.encode(encryptedDoc);
    //         return new HcsDidMessage(operation, did, didDocumentBase64);
    //     };
    // }

    /**
     * Provides a decryption function that converts {@link HcsDidMessage} in encrypted for into a plain form.
     *
     * @param decryptionFunction The decryption function to use for decryption of single attributes.
     * @return The Decryption function for the {@link HcsDidMessage}
     */
    // public static getDecrypter(decryptionFunction: Decrypter<string>): Decrypter<HcsDidMessage> {
    //     if (decryptionFunction == null) {
    //         throw "Decryption function is missing or null.";
    //     }
    //     return function (encryptedMsg: HcsDidMessage, consensusTimestamp: Timestamp): HcsDidMessage {
    //         const operation: DidMethodOperation = encryptedMsg.getOperation();
    //         // Decrypt DID string
    //         let decryptedDid: string = encryptedMsg.getDid();
    //         if (decryptedDid != null) {
    //             const did: string = Hashing.base64.decode(decryptedDid);
    //             decryptedDid = decryptionFunction(did, consensusTimestamp);
    //         }
    //         // Decrypt DID document
    //         let decryptedDocBase64 = encryptedMsg.getDidDocumentBase64();
    //         if (decryptedDocBase64 != null) {
    //             const doc: string = Hashing.base64.decode(decryptedDocBase64);
    //             decryptedDocBase64 = decryptionFunction(doc, consensusTimestamp);
    //         }
    //         return new HcsDidMessage(operation, decryptedDid, decryptedDocBase64);
    //     };
    // }
}
