import {MessageTransaction} from "../message-transaction";
import {HcsVcMessage} from "./hcs-vc-message";
import {HcsVcOperation} from "./hcs-vc-operation";
import {PublicKey, TopicId} from "@hashgraph/sdk";
import {MessageEnvelope} from "../message-envelope";
import {Validator} from "../../../utils/validator";
import {MessageListener} from "../message-listener";
import {HcsVcTopicListener} from "./hcs-vc-topic-listener";
import {Encrypter} from "../message";

/**
 * The DID document creation, update or deletion transaction.
 * Builds a correct {@link HcsDidMessage} and send it to HCS DID topic.
 */
export class HcsVcTransaction extends MessageTransaction<HcsVcMessage> {
    private operation: HcsVcOperation;
    private credentialHash: string;
    private signerPublicKey: PublicKey;

    /**
     * Instantiates a new transaction object.
     *
     * @param topicId         The HCS VC topic ID where message will be submitted.
     * @param operation       The operation to be performed on a verifiable credential.
     * @param credentialHash  The hash of a credential.
     * @param signerPublicKey Public key of the signer of this operation.
     */
    constructor(topicId: TopicId, operation: HcsVcOperation, credentialHash: string, signerPublicKey: PublicKey);

    /**
     * Instantiates a new transaction object from a message that was already prepared.
     *
     * @param topicId         The HCS VC topic ID where message will be submitted.
     * @param message         The message envelope.
     * @param signerPublicKey Public key of the signer of this operation.
     */
    constructor(topicId: TopicId, message: MessageEnvelope<HcsVcMessage>, signerPublicKey: PublicKey);
    constructor(...args) {
        if (
            (args.length === 4) &&
            (args[0] instanceof TopicId) &&
            // (args[1] instanceof HcsVcOperation) &&
            (typeof args[2] === 'string') &&
            (args[3] instanceof PublicKey)
        ) {
            const [topicId, operation, credentialHash, signerPublicKey] = args;
            super(topicId);
            this.operation = operation;
            this.credentialHash = credentialHash;
            this.signerPublicKey = signerPublicKey;
        } else if (
            (args.length === 3) &&
            (args[0] instanceof TopicId) &&
            (args[1] instanceof MessageEnvelope) &&
            (args[2] instanceof PublicKey)
        ) {
            const [topicId, message, signerPublicKey] = args;
            super(topicId, message);
            this.signerPublicKey = signerPublicKey;
            this.operation = null;
            this.credentialHash = null;
        }
    }

    protected validate(validator: Validator): void {
        super.validate(validator);
        validator.require(!!this.credentialHash || !!this.message, 'Verifiable credential hash is null or empty.');
        validator.require(!!this.operation || !!this.message, 'Operation on verifiable credential is not defined.');
    }

    protected buildMessage(): MessageEnvelope<HcsVcMessage> {
        return HcsVcMessage.fromCredentialHash(this.credentialHash, this.operation);
    }

    protected provideTopicListener(topicIdToListen: TopicId): MessageListener<HcsVcMessage> {
        return new HcsVcTopicListener(topicIdToListen, (s) => {
            return [this.signerPublicKey]
        });
    }

    protected provideMessageEncrypter(encryptionFunction: Encrypter<string>): (input: HcsVcMessage) => HcsVcMessage {
        return HcsVcMessage.getEncrypter(encryptionFunction);
    }
}
