import { PublicKey, TopicId, TopicMessage } from "@hashgraph/sdk";
import { MessageEnvelope } from "../message-envelope";
import { MessageListener } from "../message-listener";
import { HcsVcMessage } from "./hcs-vc-message";

export type PublicKeysProvider = (t: string) => PublicKey[];

/**
 * A listener of confirmed {@link HcsVcMessage} messages from a VC topic.
 * Messages are received from a given mirror node, parsed and validated.
 */
export class HcsVcTopicListener extends MessageListener<HcsVcMessage> {
    /**
     * A function providing a collection of public keys accepted for a given credential hash.
     * If the function is not supplied, the listener will not validate signatures.
     */
    private publicKeysProvider: PublicKeysProvider;

    /**
     * Creates a new instance of a VC topic listener for the given consensus topic.
     * By default, invalid messages are ignored and errors are not.
     * Listener without a public key provider will not validate message signatures.
     *
     * @param vcTopicId The VC consensus topic ID.
     */
    constructor(vcTopicId: TopicId)
    /**
     * Creates a new instance of a VC topic listener for the given consensus topic.
     * By default, invalid messages are ignored and errors are not.
     *
     * @param vcTopicId          The VC consensus topic ID.
     * @param publicKeysProvider Provider of a public keys acceptable for a given VC hash.
     */
    constructor(vcTopicId: TopicId, publicKeysProvider: PublicKeysProvider);
    constructor(...args: any[]) {
        const vcTopicId = args[0] as TopicId;
        super(vcTopicId);
        if (args[1]) {
            this.publicKeysProvider = args[1];
        } else {
            this.publicKeysProvider = null;
        }
    }

    protected override extractMessage(response: TopicMessage): MessageEnvelope<HcsVcMessage> {
        let result: MessageEnvelope<HcsVcMessage> = null;
        try {
            result = MessageEnvelope.fromMirrorResponse(response, HcsVcMessage);
        } catch (err) {
            this.handleError(err);
        }
        return result;
    }

    protected override isMessageValid(envelope: MessageEnvelope<HcsVcMessage>, response: TopicMessage): boolean {
        try {
            const msgDecrypter = !!this.decrypter ? HcsVcMessage.getDecrypter(this.decrypter) : null;

            const message: HcsVcMessage = envelope.open(msgDecrypter);
            if (message == null) {
                this.reportInvalidMessage(response, "Empty message received when opening envelope");
                return false;
            }

            if (!message.isValid()) {
                this.reportInvalidMessage(response, "Message content validation failed.");
                return false;
            }

            // Validate signature only if public key provider has been supplied.
            if (!!this.publicKeysProvider && !this.isSignatureAccepted(envelope)) {
                this.reportInvalidMessage(response, "Signature validation failed");
                return false;
            }

            return true;
        } catch (err) {
            this.handleError(err);
            this.reportInvalidMessage(response, "Exception while validating message: " + err.getMessage());
            return false;
        }
    }

    /**
     * Checks if the signature on the envelope is accepted by any public key supplied for the credential hash.
     *
     * @param envelope The message envelope.
     * @return True if signature is accepted, false otherwise.
     */
    private isSignatureAccepted(envelope: MessageEnvelope<HcsVcMessage>): boolean {
        if (!this.publicKeysProvider) {
            return false;
        }

        const message: HcsVcMessage = envelope.open();
        const acceptedKeys: PublicKey[] = this.publicKeysProvider(message.getCredentialHash());
        if (!acceptedKeys || !acceptedKeys.length) {
            return false;
        }

        for (let publicKey of acceptedKeys) {
            if (envelope.isSignatureValid(publicKey)) {
                return true;
            }
        }

        return false;
    }
}