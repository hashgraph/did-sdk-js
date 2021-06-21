import {MessageTransaction} from "../message-transaction";
import {HcsDidMessage} from "./hcs-did-message";
import {DidMethodOperation} from "../../did-method-operation";
import {PublicKey, TopicId} from "@hashgraph/sdk";
import {MessageEnvelope} from "../message-envelope";
import {Validator} from "../../../utils/validator";
import {MessageListener} from "../message-listener";
import {HcsDidTopicListener} from "./hcs-did-topic-listener";
import {Encrypter} from "../message";

/**
 * The DID document creation, update or deletion transaction.
 * Builds a correct {@link HcsDidMessage} and send it to HCS DID topic.
 */
export class HcsDidTransaction extends MessageTransaction<HcsDidMessage> {
    private operation: DidMethodOperation;
    private didDocument: string;

    /**
     * Instantiates a new transaction object from a message that was already prepared.
     *
     * @param topicId The HCS DID topic ID where message will be submitted.
     * @param message The message envelope.
     */
    constructor(message: MessageEnvelope<HcsDidMessage>, topicId: TopicId);

    /**
     * Instantiates a new transaction object.
     *
     * @param operation The operation to be performed on a DID document.
     * @param topicId   The HCS DID topic ID where message will be submitted.
     */
    constructor(operation: DidMethodOperation, topicId: TopicId);
    constructor(...args) {
        if (
            (args[0] instanceof MessageEnvelope) &&
            (args[1] instanceof TopicId) &&
            (args.length === 2)
        ) {
            const [message, topicId] = args;
            super(topicId, message);
            this.operation = null;
        } else if (args.length === 2) {
            const [operation, topicId] = args;
            super(topicId);
            this.operation = operation;
        } else {
            throw new Error('Invalid arguments')
        }
    }

    /**
     * Sets a DID document as JSON string that will be submitted to HCS.
     *
     * @param didDocument The didDocument to be published.
     * @return This transaction instance.
     */
    public setDidDocument(didDocument: string): HcsDidTransaction {
        this.didDocument = didDocument;
        return this;
    }

    protected validate(validator: Validator): void {
        super.validate(validator);
        validator.require(!!this.didDocument || !!this.message, 'DID document is mandatory.');
        validator.require(!!this.operation || !!this.message, 'DID method operation is not defined.');
    }

    protected buildMessage(): MessageEnvelope<HcsDidMessage> {
        return HcsDidMessage.fromDidDocumentJson(this.didDocument, this.operation);
    }

    protected provideTopicListener(topicIdToListen: TopicId): MessageListener<HcsDidMessage> {
        return new HcsDidTopicListener(topicIdToListen);
    }

    protected provideMessageEncrypter(encryptionFunction: Encrypter<string>): (input: HcsDidMessage) => HcsDidMessage {
        return HcsDidMessage.getEncrypter(encryptionFunction);
    }
}
