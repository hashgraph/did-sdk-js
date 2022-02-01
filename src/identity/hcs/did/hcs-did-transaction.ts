import { TopicId } from "@hashgraph/sdk";
import { Encrypter } from "../message";
import { MessageEnvelope } from "../message-envelope";
import { MessageListener } from "../message-listener";
import { MessageTransaction } from "../message-transaction";
import { HcsDidMessage } from "./hcs-did-message";
import { HcsDidTopicListener } from "./hcs-did-topic-listener";

/**
 * The DID document creation, update or deletion transaction.
 * Builds a correct {@link HcsDidMessage} and send it to HCS DID topic.
 */
export class HcsDidTransaction extends MessageTransaction<HcsDidMessage> {
    /**
     * Instantiates a new transaction object from a message that was already prepared.
     *
     * @param topicId The HCS DID topic ID where message will be submitted.
     * @param message The message envelope.
     */
    constructor(message: MessageEnvelope<HcsDidMessage>, topicId: TopicId);
    constructor(...args) {
        if (args[0] instanceof MessageEnvelope && args[1] instanceof TopicId && args.length === 2) {
            const [message, topicId] = args;
            super(topicId, message);
        } else {
            throw new Error("Invalid arguments");
        }
    }

    protected buildMessage(): MessageEnvelope<HcsDidMessage> {
        throw new Error("we no longer submit the whole DID document");
        // return HcsDidMessage.fromDidDocumentJson(this.didDocument, this.operation);
    }

    protected provideTopicListener(topicIdToListen: TopicId): MessageListener<HcsDidMessage> {
        return new HcsDidTopicListener(topicIdToListen);
    }

    protected provideMessageEncrypter(encryptionFunction: Encrypter<string>): (input: HcsDidMessage) => HcsDidMessage {
        throw new Error("we no longer encrypt messages");
        // return HcsDidMessage.getEncrypter(encryptionFunction);
    }
}
