import { Client, Timestamp, TopicId, TopicMessage, TopicMessageQuery } from "@hashgraph/sdk";
import SubscriptionHandle from "@hashgraph/sdk/lib/topic/SubscriptionHandle";
import { DidError } from "../../did-error";
import { MessageEnvelope } from "../message-envelope";
import { HcsDidMessage } from "./hcs-did-message";

/**
 * A listener of confirmed {@link HcsDidMessage} messages from a DID topic.
 * Messages are received from a given mirror node, parsed and validated.
 */
export class HcsDidTopicListener {
    protected topicId: TopicId;
    protected query: TopicMessageQuery;
    protected errorHandler: (input: Error) => void;
    protected ignoreErrors: boolean;
    protected subscriptionHandle: SubscriptionHandle;
    protected filters: ((input: TopicMessage) => boolean)[];
    protected invalidMessageHandler: (t: TopicMessage, u: string) => void;

    /**
     * Creates a new instance of a DID topic listener for the given consensus topic.
     * By default, invalid messages are ignored and errors are not.
     *
     * @param didTopicId The DID consensus topic ID.
     */
    constructor(topicId: TopicId, startTime: Timestamp = new Timestamp(0, 0)) {
        this.topicId = topicId;
        this.query = new TopicMessageQuery().setTopicId(topicId).setStartTime(startTime);
        this.ignoreErrors = false;
    }

    /**
     * Adds a custom filter for topic responses from a mirror node.
     * Messages that do not pass the test are skipped before any other checks are run.
     *
     * @param filter The filter function.
     * @return This listener instance.
     */
    public addFilter(filter: (input: TopicMessage) => boolean): HcsDidTopicListener {
        if (!this.filters) {
            this.filters = [];
        }
        this.filters.push(filter);

        return this;
    }

    /**
     * Subscribes to mirror node topic messages stream.
     *
     * @param client   Mirror client instance.
     * @param receiver Receiver of parsed messages.
     * @return This listener instance.
     */
    public subscribe(client: Client, receiver: (input: MessageEnvelope<HcsDidMessage>) => void): HcsDidTopicListener {
        const errorHandler = (message: TopicMessage, error: Error) => {
            this.handleError(error);
        };
        const listener = (message: TopicMessage) => {
            this.handleResponse(message, receiver);
        };

        this.subscriptionHandle = this.query.subscribe(client, errorHandler, listener);

        return this;
    }

    /**
     * Stops receiving messages from the topic.
     */
    public unsubscribe(): void {
        if (this.subscriptionHandle) {
            this.subscriptionHandle.unsubscribe();
        }
    }

    /**
     * Handles incoming messages from the topic on a mirror node.
     *
     * @param response Response message coming from the mirror node for the topic.
     * @param receiver Consumer of the result message.
     */
    protected handleResponse(response: TopicMessage, receiver: (input: MessageEnvelope<HcsDidMessage>) => void) {
        if (this.filters) {
            for (let filter of this.filters) {
                if (!filter(response)) {
                    this.reportInvalidMessage(response, "Message was rejected by external filter");
                    return;
                }
            }
        }

        const envelope = this.extractMessage(response);

        if (!envelope) {
            this.reportInvalidMessage(response, "Extracting envelope from the mirror response failed");
            return;
        }

        if (this.isMessageValid(envelope, response)) {
            receiver(envelope);
        }
    }

    /**
     * Extracts and parses the message inside the response object into the given type.
     *
     * @param response Response message coming from the mirror node for this listener's topic.
     * @return The message inside an envelope.
     */
    protected extractMessage(response: TopicMessage): MessageEnvelope<HcsDidMessage> {
        let result: MessageEnvelope<HcsDidMessage> = null;
        try {
            result = MessageEnvelope.fromMirrorResponse(response, HcsDidMessage);
        } catch (err) {
            this.handleError(err);
        }

        return result;
    }

    /**
     * Validates the message and its envelope signature.
     *
     * @param message  The message inside an envelope.
     * @param response Response message coming from the mirror node for this listener's topic.
     * @return True if the message is valid, False otherwise.
     */
    protected isMessageValid(envelope: MessageEnvelope<HcsDidMessage>, response: TopicMessage): boolean {
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

    /**
     * Handles the given error internally.
     * If external error handler is defined, passes the error there, otherwise raises RuntimeException or ignores it
     * depending on a ignoreErrors flag.
     *
     * @param err The error.
     * @throws RuntimeException Runtime exception with the given error in case external error handler is not defined
     *                          and errors were not requested to be ignored.
     */
    protected handleError(err: Error): void {
        if (this.errorHandler) {
            this.errorHandler(err);
        } else if (!this.ignoreErrors) {
            throw new DidError(err.message);
        }
    }

    /**
     * Reports invalid message to the handler.
     *
     * @param response The mirror response.
     * @param reason   The reason why message validation failed.
     */
    protected reportInvalidMessage(response: TopicMessage, reason: string): void {
        if (this.invalidMessageHandler) {
            this.invalidMessageHandler(response, reason);
        }
    }

    /**
     * Defines a handler for errors when they happen during execution.
     *
     * @param handler The error handler.
     * @return This transaction instance.
     */
    public onError(handler: (input: Error) => void): HcsDidTopicListener {
        this.errorHandler = handler;
        return this;
    }

    /**
     * Defines a handler for invalid messages received from the topic.
     * The first parameter of the handler is the mirror response.
     * The second parameter is the reason why the message failed validation (if available).
     *
     * @param handler The invalid message handler.
     * @return This transaction instance.
     */
    public onInvalidMessageReceived(handler: (t: TopicMessage, u: string) => void): HcsDidTopicListener {
        this.invalidMessageHandler = handler;
        return this;
    }

    public setStartTime(startTime: Timestamp): HcsDidTopicListener {
        this.query.setStartTime(startTime);
        return this;
    }

    public setEndTime(endTime: Timestamp): HcsDidTopicListener {
        this.query.setEndTime(endTime);
        return this;
    }

    public setLimit(messagesLimit: Long): HcsDidTopicListener {
        this.query.setLimit(messagesLimit);
        return this;
    }

    public setIgnoreErrors(ignoreErrors: boolean): HcsDidTopicListener {
        this.ignoreErrors = ignoreErrors;
        return this;
    }

    public onComplete(handler: () => void) {
        this.query.setCompletionHandler(handler);
        return this;
    }
}
