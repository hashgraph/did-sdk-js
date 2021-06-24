import { PublicKey, Timestamp, TopicId } from "@hashgraph/sdk";
import { Hashing } from "../../../utils/hashing";
import { TimestampUtils } from "../../../utils/timestamp-utils";
import { DidDocumentBase } from "../../did-document-base";
import { DidDocumentJsonProperties } from "../../did-document-json-properties";
import { DidMethodOperation } from "../../did-method-operation";
import { Decrypter, Encrypter, Message } from "../message";
import { MessageEnvelope } from "../message-envelope";
import { HcsDid } from "./hcs-did";

/**
 * The DID document message submitted to appnet's DID Topic.
 */
export class HcsDidMessage extends Message {
    protected operation: DidMethodOperation;
    protected did: string;
    protected didDocumentBase64: string;
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
    constructor(operation: DidMethodOperation, did: string, didDocumentBase64: string) {
        super();
        this.operation = operation;
        this.did = did;
        this.didDocumentBase64 = didDocumentBase64;
    }

    public getOperation(): DidMethodOperation {
        return this.operation;
    }

    public getDid(): string {
        return this.did;
    }

    public getDidDocumentBase64(): string {
        return this.didDocumentBase64;
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
     * Decodes didDocumentBase64 field and returns its content.
     * In case this message is in encrypted mode, it will return encrypted content,
     * so getPlainDidDocument method should be used instead.
     * If message consensus timestamps for creation and update are provided they will be injected into the result
     * document upon decoding.
     *
     * @return The decoded DID document as JSON string.
     */
    public getDidDocument(): string {
        if (this.didDocumentBase64 == null) {
            return null;
        }

        let document: string = Hashing.base64.decode(this.didDocumentBase64);

        // inject timestamps
        if (this.created != null || this.updated != null) {
            const root = JSON.parse(document);
            if (this.created != null) {
                root[DidDocumentJsonProperties.CREATED] = TimestampUtils.toJSON(this.created);
            }

            if (this.updated != null) {
                root[DidDocumentJsonProperties.UPDATED] = TimestampUtils.toJSON(this.updated);
            }
            document = JSON.stringify(root);
        }

        return document;
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
        if (this.did == null || this.didDocumentBase64 == null) {
            return false;
        }

        try {
            const doc: DidDocumentBase = DidDocumentBase.fromJson(this.getDidDocument());

            // Validate if DID and DID document are present and match
            if (this.did != doc.getId()) {
                return false;
            }

            // Validate if DID root key is present in the document
            if (doc.getDidRootKey() == null || doc.getDidRootKey().getPublicKeyBase58() == null) {
                return false;
            }

            // Verify that DID was derived from this DID root key
            const hcsDid: HcsDid = HcsDid.fromString(this.did);

            // Extract public key from the DID document
            const publicKeyBytes: Uint8Array = Hashing.base58.decode(doc.getDidRootKey().getPublicKeyBase58());
            const publicKey: PublicKey = PublicKey.fromBytes(publicKeyBytes);

            if (HcsDid.publicKeyToIdString(publicKey) != hcsDid.getIdString()) {
                return false;
            }

            // Verify that the message was sent to the right topic, if the DID contains the topic
            if (!!didTopicId && !!hcsDid.getDidTopicId() && (didTopicId.toString() != hcsDid.getDidTopicId().toString())) {
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
    public extractDidRootKey(): PublicKey {
        let result: PublicKey = null;
        try {
            const doc: DidDocumentBase = DidDocumentBase.fromJson(this.getDidDocument());
            // Make sure that DID root key is present in the document
            if (doc.getDidRootKey() != null && doc.getDidRootKey().getPublicKeyBase58() != null) {
                const publicKeyBytes: Uint8Array = Hashing.base58.decode(doc.getDidRootKey().getPublicKeyBase58());
                result = PublicKey.fromBytes(publicKeyBytes);
            }
            // ArrayIndexOutOfBoundsException is thrown in case public key is invalid in PublicKey.fromBytes
        } catch (e) {
            return null;
        }

        return result;
    }

    public toJsonTree(): any {
        const result: any = super.toJsonTree();
        result.operation = this.operation;
        result.did = this.did;
        result.didDocumentBase64 = this.didDocumentBase64;
        return result;
    }

    public static fromJsonTree(tree: any, result?: HcsDidMessage): HcsDidMessage {
        if (!result) {
            result = new HcsDidMessage(tree.operation, tree.did, tree.didDocumentBase64);
        } else {
            result.operation = tree.operation;
            result.did = tree.did;
            result.didDocumentBase64 = tree.didDocumentBase64;
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
    public static fromDidDocumentJson(didDocumentJson: string, operation: DidMethodOperation): MessageEnvelope<HcsDidMessage> {
        const didDocumentBase: DidDocumentBase = DidDocumentBase.fromJson(didDocumentJson);
        const didDocumentBase64 = Hashing.base64.encode(didDocumentJson);
        const message: HcsDidMessage = new HcsDidMessage(operation, didDocumentBase.getId(), didDocumentBase64);
        return new MessageEnvelope<HcsDidMessage>(message);
    }

    /**
     * Provides an encryption operator that converts an {@link HcsDidMessage} into encrypted one.
     *
     * @param encryptionFunction The encryption function to use for encryption of single attributes.
     * @return The encryption operator instance.
     */
    public static getEncrypter(encryptionFunction: Encrypter<string>): Encrypter<HcsDidMessage> {
        if (encryptionFunction == null) {
            throw "Encryption function is missing or null.";
        }
        return function (message: HcsDidMessage): HcsDidMessage {
            const operation: DidMethodOperation = message.getOperation();
            // Encrypt the DID
            const encryptedDid: string = encryptionFunction(message.getDid());
            const did: string = Hashing.base64.encode(encryptedDid);
            // Encrypt the DID document
            const encryptedDoc: string = encryptionFunction(message.getDidDocumentBase64());
            const didDocumentBase64: string = Hashing.base64.encode(encryptedDoc);
            return new HcsDidMessage(operation, did, didDocumentBase64);
        };
    }

    /**
     * Provides a decryption function that converts {@link HcsDidMessage} in encrypted for into a plain form.
     *
     * @param decryptionFunction The decryption function to use for decryption of single attributes.
     * @return The Decryption function for the {@link HcsDidMessage}
     */
    public static getDecrypter(decryptionFunction: Decrypter<string>): Decrypter<HcsDidMessage> {
        if (decryptionFunction == null) {
            throw "Decryption function is missing or null.";
        }
        return function (encryptedMsg: HcsDidMessage, consensusTimestamp: Timestamp): HcsDidMessage {
            const operation: DidMethodOperation = encryptedMsg.getOperation();
            // Decrypt DID string
            let decryptedDid: string = encryptedMsg.getDid();
            if (decryptedDid != null) {
                const did: string = Hashing.base64.decode(decryptedDid);
                decryptedDid = decryptionFunction(did, consensusTimestamp);
            }
            // Decrypt DID document
            let decryptedDocBase64 = encryptedMsg.getDidDocumentBase64();
            if (decryptedDocBase64 != null) {
                const doc: string = Hashing.base64.decode(decryptedDocBase64);
                decryptedDocBase64 = decryptionFunction(doc, consensusTimestamp);
            }
            return new HcsDidMessage(operation, decryptedDid, decryptedDocBase64);
        };
    }
}
