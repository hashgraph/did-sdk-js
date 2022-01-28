import { Client, Timestamp, TopicId, TopicMessage, TopicMessageQuery } from "@hashgraph/sdk";
import SubscriptionHandle from "@hashgraph/sdk/lib/topic/SubscriptionHandle";
import Long from "long";
import { Decrypter, Message } from "./message";
import { MessageEnvelope } from "./message-envelope";
import { MessageMode } from "./message-mode";

/**
 * A listener of confirmed messages from a HCS identity topic.
 * Messages are received from a given mirror node, parsed and validated.
 */
export abstract class MessageListener<T extends Message> {
    protected topicId: TopicId;
    protected query: TopicMessageQuery;
    protected errorHandler: (input: Error) => void;
    protected ignoreErrors: boolean;
    protected decrypter: Decrypter<string>;
    protected subscriptionHandle: SubscriptionHandle;
    protected filters: ((input: TopicMessage) => boolean)[];
    protected invalidMessageHandler: (t: TopicMessage, u: string) => void;

    /**
     * Creates a new instance of a topic listener for the given consensus topic.
     * By default, invalid messages are ignored and errors are not.
     *
     * @param topicId The consensus topic ID.
     */
    constructor(topicId: TopicId) {
        this.topicId = topicId;
        this.query = new TopicMessageQuery().setTopicId(topicId);
        this.ignoreErrors = false;
    }

    /**
     * Extracts and parses the message inside the response object into the given type.
     *
     * @param response Response message coming from the mirror node for for this listener's topic.
     * @return The message inside an envelope.
     */
    protected abstract extractMessage(response: TopicMessage): MessageEnvelope<T>;

    /**
     * Validates the message and its envelope signature.
     *
     * @param message  The message inside an envelope.
     * @param response Response message coming from the mirror node for for this listener's topic.
     * @return True if the message is valid, False otherwise.
     */
    protected abstract isMessageValid(message: MessageEnvelope<T>, response: TopicMessage): boolean;

    /**
     * Adds a custom filter for topic responses from a mirror node.
     * Messages that do not pass the test are skipped before any other checks are run.
     *
     * @param filter The filter function.
     * @return This listener instance.
     */
    public addFilter(filter: (input: TopicMessage) => boolean): MessageListener<T> {
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
    public subscribe(client: Client, receiver: (input: MessageEnvelope<T>) => void): MessageListener<T> {
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
    protected handleResponse(response: TopicMessage, receiver: (input: MessageEnvelope<T>) => void) {
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

        if (MessageMode.ENCRYPTED === envelope.getMode() && !this.decrypter) {
            this.reportInvalidMessage(response, "Message is encrypted and no decryption function was provided");
            return;
        }

        if (this.isMessageValid(envelope, response)) {
            receiver(envelope);
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
            throw new Error(err.message);
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
    public onError(handler: (input: Error) => void): MessageListener<T> {
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
    public onInvalidMessageReceived(handler: (t: TopicMessage, u: string) => void): MessageListener<T> {
        this.invalidMessageHandler = handler;
        return this;
    }

    /**
     * Defines decryption function that decrypts submitted message attributes after consensus is reached.
     * Decryption function must accept a byte array of encrypted message and an Timestamp that is its consensus timestamp,
     * If decrypter is not specified, encrypted messages will be ignored.
     *
     * @param decrypter The decryption function to use.
     * @return This transaction instance.
     */
    public onDecrypt(decrypter: Decrypter<string>): MessageListener<T> {
        this.decrypter = decrypter;
        return this;
    }

    public setStartTime(startTime: Timestamp): MessageListener<T> {
        this.query.setStartTime(startTime);
        return this;
    }

    public setEndTime(endTime: Timestamp): MessageListener<T> {
        this.query.setEndTime(endTime);
        return this;
    }

    public setLimit(messagesLimit: Long): MessageListener<T> {
        this.query.setLimit(messagesLimit);
        return this;
    }

    public setIgnoreErrors(ignoreErrors: boolean): MessageListener<T> {
        this.ignoreErrors = ignoreErrors;
        return this;
    }
}
