import { Client, Timestamp, TopicId } from "@hashgraph/sdk";
import Long from "long";
import { Sleep } from "../../utils/sleep";
import { Validator } from "../../utils/validator";
import { Decrypter, Message } from "./message";
import { MessageEnvelope } from "./message-envelope";
import { MessageListener } from "./message-listener";

export abstract class MessageResolver<T extends Message> {
    /**
     * Default time to wait before finishing resolution and after the last message was received.
     */
    public static DEFAULT_TIMEOUT: Long = Long.fromInt(30000);

    protected topicId: TopicId;
    protected results: Map<string, MessageEnvelope<T>>;

    private lastMessageArrivalTime: Long;
    private resultsHandler: (input: Map<string, MessageEnvelope<T>>) => void;
    private errorHandler: (input: Error) => void;
    private decrypter: Decrypter<string>;
    private existingSignatures: string[];
    private listener: MessageListener<T>;
    private noMoreMessagesTimeout: Long;

    /**
     * Instantiates a message resolver.
     *
     * @param topicId Consensus topic ID.
     */
    constructor(topicId: TopicId) {
        this.topicId = topicId;
        this.results = new Map();

        this.noMoreMessagesTimeout = MessageResolver.DEFAULT_TIMEOUT;
        this.lastMessageArrivalTime = Long.fromInt(Date.now());
    }

    /**
     * Checks if the message matches preliminary search criteria.
     *
     * @param message The message read from the topic.
     * @return True if the message matches search criteria, false otherwise.
     */
    protected abstract matchesSearchCriteria(message: T): boolean;

    /**
     * Applies custom filters on the message and if successfully verified, adds it to the results map.
     *
     * @param envelope Message inside an envelope in PLAIN mode.
     */
    protected abstract processMessage(envelope: MessageEnvelope<T>): void;

    /**
     * Supplies message listener for messages of specified type.
     *
     * @return The {@link MessageListener} instance.
     */
    protected abstract supplyMessageListener(): MessageListener<T>;

    /**
     * Resolves queries defined in implementing classes against a mirror node.
     *
     * @param client The mirror node client.
     */
    public execute(client: Client): void {
        new Validator().checkValidationErrors("Resolver not executed: ", (v) => {
            return this.validate(v);
        });

        this.existingSignatures = [];

        this.listener = this.supplyMessageListener();

        this.listener
            .setStartTime(new Timestamp(0, 0))
            .setEndTime(Timestamp.fromDate(new Date()))
            .setIgnoreErrors(false)
            .onError(this.errorHandler)
            .onDecrypt(this.decrypter)
            .subscribe(client, (msg) => {
                return this.handleMessage(msg);
            });

        this.lastMessageArrivalTime = Long.fromInt(Date.now());
        this.waitOrFinish();
    }

    /**
     * Handles incoming DID messages from DID Topic on a mirror node.
     *
     * @param envelope The parsed message envelope in a PLAIN mode.
     */
    private handleMessage(envelope: MessageEnvelope<T>): void {
        this.lastMessageArrivalTime = Long.fromInt(Date.now());

        if (!this.matchesSearchCriteria(envelope.open())) {
            return;
        }

        if (this.existingSignatures.indexOf(envelope.getSignature()) != -1) {
            return;
        }

        this.existingSignatures.push(envelope.getSignature());
        this.processMessage(envelope);
    }

    /**
     * Waits for a new message from the topic for the configured amount of time.
     */
    protected async waitOrFinish(): Promise<void> {
        const timeDiff = Long.fromInt(Date.now()).sub(this.lastMessageArrivalTime);

        if (timeDiff.lt(this.noMoreMessagesTimeout)) {
            await Sleep(this.noMoreMessagesTimeout.sub(timeDiff).toNumber());
            await this.waitOrFinish();
            return;
        }

        this.resultsHandler(this.results);

        if (this.listener) {
            this.listener.unsubscribe();
        }
    }

    /**
     * Defines a handler for resolution results.
     * This will be called when the resolution process is finished.
     *
     * @param handler The results handler.
     * @return This resolver instance.
     */
    public whenFinished(handler: (input: Map<string, MessageEnvelope<T>>) => void): MessageResolver<T> {
        this.resultsHandler = handler;
        return this;
    }

    /**
     * Defines a handler for errors when they happen during resolution.
     *
     * @param handler The error handler.
     * @return This resolver instance.
     */
    public onError(handler: (input: Error) => void): MessageResolver<T> {
        this.errorHandler = handler;
        return this;
    }

    /**
     * Defines a maximum time in milliseconds to wait for new messages from the topic.
     * Default is 30 seconds.
     *
     * @param timeout The timeout in milliseconds to wait for new messages from the topic.
     * @return This resolver instance.
     */
    public setTimeout(timeout: Long | number): MessageResolver<T> {
        this.noMoreMessagesTimeout = Long.fromValue(timeout);
        return this;
    }

    /**
     * Defines decryption function that decrypts submitted the message after consensus was reached.
     * Decryption function must accept a byte array of encrypted message and an Instant that is its consensus timestamp,
     * If decrypter is not specified, encrypted messages will be ignored.
     *
     * @param decrypter The decrypter to use.
     * @return This resolver instance.
     */
    public onDecrypt(decrypter: Decrypter<string>): MessageResolver<T> {
        this.decrypter = decrypter;
        return this;
    }

    /**
     * Runs validation logic of the resolver's configuration.
     *
     * @param validator The errors validator.
     */
    protected validate(validator: Validator): void {
        validator.require(this.results.size > 0, "Nothing to resolve.");
        validator.require(!!this.topicId, "Consensus topic ID not defined.");
        validator.require(!!this.resultsHandler, "Results handler 'whenFinished' not defined.");
    }
}
