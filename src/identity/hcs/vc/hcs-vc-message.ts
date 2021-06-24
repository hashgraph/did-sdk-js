import { Timestamp } from "@hashgraph/sdk";
import { Hashing } from "../../../utils/hashing";
import { Decrypter, Encrypter, Message } from "../message";
import { MessageEnvelope } from "../message-envelope";
import { HcsVcOperation } from "./hcs-vc-operation";

export class HcsVcMessage extends Message {
    private operation: HcsVcOperation;
    private credentialHash: string;

    /**
     * Creates a new message instance.
     *
     * @param operation      Operation type.
     * @param credentialHash Credential hash.
     */
    constructor(operation: HcsVcOperation, credentialHash: string) {
        super();
        this.operation = operation;
        this.credentialHash = credentialHash;
    }

    /**
     * Checks if the message is valid from content point of view.
     * Does not verify hash nor any signatures.
     *
     * @return True if the message is valid and False otherwise.
     */
    public isValid(): boolean {
        return (!this.credentialHash && !this.operation);
    }

    public getOperation(): HcsVcOperation {
        return this.operation;
    }

    public getCredentialHash(): string {
        return this.credentialHash;
    }

    public toJsonTree(): any {
        const result: any = super.toJsonTree();
        result.operation = this.operation;
        result.credentialHash = this.credentialHash;
        return result;
    }

    public static fromJsonTree(tree: any, result?: HcsVcMessage): HcsVcMessage {
        if (!result) {
            result = new HcsVcMessage(tree.operation, tree.credentialHash);
        } else {
            result.operation = tree.operation;
            result.credentialHash = tree.credentialHash;
        }
        result = super.fromJsonTree(tree, result) as HcsVcMessage;
        return result;
    }

    public toJSON(): string {
        return JSON.stringify(this.toJsonTree());
    }

    public static fromJson(json: string): Message {
        return Message.fromJsonTree(JSON.parse(json));
    }

    /**
     * Creates a new VC message for submission to HCS topic.
     *
     * @param credentialHash VC hash.
     * @param operation      The operation on a VC document.
     * @return The HCS message wrapped in an envelope for the given VC and operation.
     */
    public static fromCredentialHash(credentialHash: string, operation: HcsVcOperation): MessageEnvelope<HcsVcMessage> {
        const message: HcsVcMessage = new HcsVcMessage(operation, credentialHash);
        return new MessageEnvelope<HcsVcMessage>(message);
    }

    /**
     * Provides an encryption operator that converts an {@link HcsVcMessage} into encrypted one.
     *
     * @param encryptionFunction The encryption function to use for encryption of single attributes.
     * @return The encryption operator instance.
     */
    public static getEncrypter(encryptionFunction: Encrypter<string>): Encrypter<HcsVcMessage> {
        if (encryptionFunction == null) {
            throw "Encryption function is missing or null.";
        }
        return function (message: HcsVcMessage) {
            // Encrypt the credential hash
            const encryptedHash: string = encryptionFunction(message.getCredentialHash());
            const hash = Hashing.base64.encode(encryptedHash);
            return new HcsVcMessage(message.getOperation(), hash);
        };
    }

    /**
     * Provides a decryption function that converts {@link HcsVcMessage} in encrypted for into a plain form.
     *
     * @param decryptionFunction The decryption function to use for decryption of single attributes.
     * @return The decryption function for the {@link HcsVcMessage}
     */
    public static getDecrypter(decryptionFunction: Decrypter<string>): Decrypter<HcsVcMessage> {
        if (decryptionFunction == null) {
            throw "Decryption function is missing or null.";
        }
        return function (encryptedMsg: HcsVcMessage, consensusTimestamp: Timestamp) {
            // Decrypt DID string
            let decryptedHash: string = encryptedMsg.getCredentialHash();
            if (decryptedHash != null) {
                const hash: string = Hashing.base64.decode(decryptedHash);
                decryptedHash = decryptionFunction(hash, consensusTimestamp);
            }
            return new HcsVcMessage(encryptedMsg.getOperation(), decryptedHash);
        };
    }
}
