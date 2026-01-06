import { PublicKey, Timestamp, TopicMessage } from "@hashgraph/sdk";
import { Base64 } from "js-base64";
import Long from "long";
import { HcsDidMessage } from "../..";
import { ArraysUtils } from "../../utils/arrays-utils";
import { DidError } from "../did-error";
import { JsonClass } from "./json-class";
import { SerializableMirrorConsensusResponse } from "./serializable-mirror-consensus-response";

export type PublicKeyProvider<T extends HcsDidMessage> = (evn: MessageEnvelope<T>) => PublicKey;
export type SignFunction = (message: Uint8Array) => Uint8Array;

/**
 * The envelope for Hedera identity messages sent to HCS DID or VC topics.
 */
export class MessageEnvelope<T extends HcsDidMessage> {
    private static MESSAGE_KEY = "message";
    private static SIGNATURE_KEY = "signature";

    private static serialVersionUID = Long.fromInt(1);

    protected message: T;
    protected signature: string;

    protected get messageJson(): string {
        if (!this.message) {
            return null;
        }
        return this.message.toJSON();
    }
    protected mirrorResponse: SerializableMirrorConsensusResponse;

    /**
     * Creates a new message envelope for the given message.
     *
     * @param message The message.
     */
    constructor(message: T);
    constructor();
    constructor(...args: any[]) {
        if (args.length === 0) {
            // do nothing
        } else if (args.length === 1) {
            const [message] = args;

            this.message = message;
        } else {
            throw new DidError("Wrong arguments passed to constructor");
        }
    }

    /**
     * Signs this message envelope with the given signing function.
     *
     * @param signer The signing function.
     * @return This envelope signed and serialized to JSON, ready for submission to HCS topic.
     */
    public sign(signer: SignFunction): Uint8Array {
        if (!signer) {
            throw new DidError("Signing function is not provided.");
        }

        if (this.signature) {
            throw new DidError("Message is already signed.");
        }

        const msgBytes = ArraysUtils.fromString(this.message.toJSON());
        const signatureBytes = signer(msgBytes);
        this.signature = Base64.fromUint8Array(signatureBytes);

        return ArraysUtils.fromString(this.toJSON());
    }

    public toJsonTree(): any {
        const result: any = {};
        if (this.message) {
            result[MessageEnvelope.MESSAGE_KEY] = this.message.toJsonTree();
        }
        if (this.signature) {
            result[MessageEnvelope.SIGNATURE_KEY] = this.signature;
        }
        return result;
    }

    /**
     * Converts this message envelope into a JSON string.
     *
     * @return The JSON string representing this message envelope.
     */
    public toJSON(): string {
        return JSON.stringify(this.toJsonTree());
    }

    /**
     * Converts a message from a DID or VC topic response into object instance.
     *
     * @param <U>          Type of the message inside envelope.
     * @param response     Topic message as a response from mirror node.
     * @param messageClass Class type of the message inside envelope.
     * @return The {@link MessageEnvelope}.
     */
    public static fromMirrorResponse<U extends HcsDidMessage>(
        response: TopicMessage,
        messageClass: JsonClass<U>
    ): MessageEnvelope<U> {
        const msgJson = ArraysUtils.toString(response.contents);
        const result = MessageEnvelope.fromJson(msgJson, messageClass);
        // console.log(result);
        result.mirrorResponse = new SerializableMirrorConsensusResponse(response);

        return result;
    }

    /**
     * Converts a VC topic message from a JSON string into object instance.
     *
     * @param <U>          Type of the message inside envelope.
     * @param json         VC topic message as JSON string.
     * @param messageClass Class of the message inside envelope.
     * @return The {@link MessageEnvelope}.
     */
    public static fromJson<U extends HcsDidMessage>(json: string, messageClass: JsonClass<U>): MessageEnvelope<U> {
        const result = new MessageEnvelope<U>();
        let root;
        try {
            root = JSON.parse(json);
            result.signature = root[MessageEnvelope.SIGNATURE_KEY];
            if (root.hasOwnProperty(MessageEnvelope.MESSAGE_KEY)) {
                result.message = messageClass.fromJsonTree(root[MessageEnvelope.MESSAGE_KEY]);
            } else {
                result.message = null;
            }
        } catch (err) {
            console.warn(`Invalid message JSON message - it will be ignored`);
            // Invalid json - ignore the message
            result.message = null;
        }

        return result;
    }

    /**
     * Verifies the signature of the envelope against the public key of it's signer.
     *
     * @param publicKeyProvider Provider of a public key of this envelope signer.
     * @return True if the message is valid, false otherwise.
     */
    public isSignatureValid(publicKeyProvider: PublicKeyProvider<T>): boolean;
    public isSignatureValid(publicKey: PublicKey): boolean;
    public isSignatureValid(...args: any[]): boolean {
        if (!this.signature || !this.message) {
            return false;
        }

        let publicKey: PublicKey;
        if (typeof args[0] == "function") {
            const publicKeyProvider = args[0] as PublicKeyProvider<T>;
            publicKey = publicKeyProvider(this);
        } else {
            publicKey = args[0] as PublicKey;
        }

        if (!publicKey) {
            return false;
        }

        const signatureToVerify = Base64.toUint8Array(this.signature);
        const messageBytes = ArraysUtils.fromString(this.message.toJSON());

        return publicKey.verify(messageBytes, signatureToVerify);
    }

    /**
     * Opens a message in this envelope.
     * If the message is encrypted, the given decrypter will be used first to decrypt it.
     * If the message is not encrypted, it will be immediately returned.
     *
     * @param decrypter The function used to decrypt the message.
     * @return The message object in a plain mode.
     */
    public open(): T {
        return this.message;
    }

    public getSignature(): string {
        return this.signature;
    }

    public getConsensusTimestamp(): Timestamp {
        return !this.mirrorResponse ? null : this.mirrorResponse.consensusTimestamp;
    }

    public getMirrorResponse(): SerializableMirrorConsensusResponse {
        return this.mirrorResponse;
    }
}
