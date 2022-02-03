import { TopicId, TopicMessage } from "@hashgraph/sdk";
import { MessageEnvelope } from "../message-envelope";
import { MessageListener } from "../message-listener";
import { HcsDidMessage } from "./hcs-did-message";

/**
 * A listener of confirmed {@link HcsDidMessage} messages from a DID topic.
 * Messages are received from a given mirror node, parsed and validated.
 */
export class HcsDidTopicListener extends MessageListener<HcsDidMessage> {
    /**
     * Creates a new instance of a DID topic listener for the given consensus topic.
     * By default, invalid messages are ignored and errors are not.
     *
     * @param didTopicId The DID consensus topic ID.
     */
    constructor(didTopicId: TopicId) {
        super(didTopicId);
    }

    protected override extractMessage(response: TopicMessage): MessageEnvelope<HcsDidMessage> {
        let result: MessageEnvelope<HcsDidMessage> = null;
        try {
            result = MessageEnvelope.fromMirrorResponse(response, HcsDidMessage);
        } catch (err) {
            this.handleError(err);
        }

        return result;
    }

    protected override isMessageValid(envelope: MessageEnvelope<HcsDidMessage>, response: TopicMessage): boolean {
        try {
            const message: HcsDidMessage = envelope.open();
            if (!message) {
                this.reportInvalidMessage(response, "Empty message received when opening envelope");
                return false;
            }

            if (!message.isValid(this.topicId)) {
                this.reportInvalidMessage(response, "Message content validation failed.");
                return false;
            }

            return true;
        } catch (err) {
            this.handleError(err);
            this.reportInvalidMessage(response, "Exception while validating message: " + err.message);
            return false;
        }
    }
}
