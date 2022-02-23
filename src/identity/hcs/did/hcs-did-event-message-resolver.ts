import { Client, Timestamp, TopicId } from "@hashgraph/sdk";
import Long from "long";
import { Validator } from "../../../utils/validator";
import { MessageEnvelope } from "../message-envelope";
import { HcsDidMessage } from "./hcs-did-message";
import { HcsDidTopicListener } from "./hcs-did-topic-listener";

/**
 * Resolves the DID Events from Hedera network.
 */
export class HcsDidEventMessageResolver {
    /**
     * Default time to wait before finishing resolution and after the last message was received.
     */
    public static DEFAULT_TIMEOUT: Long = Long.fromInt(30000);

    protected topicId: TopicId;
    protected messages: MessageEnvelope<HcsDidMessage>[] = [];

    private lastMessageArrivalTime: Long;
    private nextMessageArrivalTimeout;
    private resultsHandler: (input: MessageEnvelope<HcsDidMessage>[]) => void;
    private errorHandler: (input: Error) => void;
    private existingSignatures: string[];
    private readonly listener: HcsDidTopicListener;
    private noMoreMessagesTimeout: Long;

    /**
     * Instantiates a new DID resolver for the given DID topic.
     *
     * @param topicId The HCS DID topic ID.
     */
    constructor(topicId: TopicId, startTime: Timestamp = new Timestamp(0, 0)) {
        this.topicId = topicId;
        this.listener = new HcsDidTopicListener(this.topicId, startTime);

        this.noMoreMessagesTimeout = HcsDidEventMessageResolver.DEFAULT_TIMEOUT;
        this.lastMessageArrivalTime = Long.fromInt(Date.now());
    }

    public execute(client: Client): void {
        new Validator().checkValidationErrors("Resolver not executed: ", (v) => {
            return this.validate(v);
        });

        this.existingSignatures = [];

        this.listener
            .setEndTime(Timestamp.fromDate(new Date()))
            .setIgnoreErrors(false)
            .onError(this.errorHandler)
            .onComplete(() => this.finish())
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
    private handleMessage(envelope: MessageEnvelope<HcsDidMessage>): void {
        this.lastMessageArrivalTime = Long.fromInt(Date.now());

        if (!this.matchesSearchCriteria(envelope.open())) {
            return;
        }

        if (this.existingSignatures.indexOf(envelope.getSignature()) != -1) {
            return;
        }

        this.existingSignatures.push(envelope.getSignature());
        this.messages.push(envelope);
    }

    /**
     * Waits for a new message from the topic for the configured amount of time.
     */
    protected async waitOrFinish(): Promise<void> {
        const timeDiff = Long.fromInt(Date.now()).sub(this.lastMessageArrivalTime);

        if (timeDiff.lt(this.noMoreMessagesTimeout)) {
            if (this.nextMessageArrivalTimeout) {
                clearTimeout(this.nextMessageArrivalTimeout);
            }
            this.nextMessageArrivalTimeout = setTimeout(
                () => this.waitOrFinish(),
                this.noMoreMessagesTimeout.sub(timeDiff).toNumber()
            );
            return;
        }

        this.finish();
    }

    protected async finish(): Promise<void> {
        this.resultsHandler(this.messages);

        if (this.nextMessageArrivalTimeout) {
            clearTimeout(this.nextMessageArrivalTimeout);
        }

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
    public whenFinished(handler: (input: MessageEnvelope<HcsDidMessage>[]) => void): HcsDidEventMessageResolver {
        this.resultsHandler = handler;
        return this;
    }

    /**
     * Defines a handler for errors when they happen during resolution.
     *
     * @param handler The error handler.
     * @return This resolver instance.
     */
    public onError(handler: (input: Error) => void): HcsDidEventMessageResolver {
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
    public setTimeout(timeout: Long | number): HcsDidEventMessageResolver {
        this.noMoreMessagesTimeout = Long.fromValue(timeout);
        return this;
    }

    /**
     * Runs validation logic of the resolver's configuration.
     *
     * @param validator The errors validator.
     */
    protected validate(validator: Validator): void {
        validator.require(!!this.topicId, "Consensus topic ID not defined.");
        validator.require(!!this.resultsHandler, "Results handler 'whenFinished' not defined.");
    }

    protected matchesSearchCriteria(message: HcsDidMessage): boolean {
        return true;
    }
}
