import { Client, Timestamp, TopicId } from "@hashgraph/sdk";
import Long from "long";
import { Validator } from "../../..";
import { Sleep } from "../../../utils/sleep";
import { MessageEnvelope } from "../message-envelope";
import { MessageListener } from "../message-listener";
import { MessageResolver } from "../message-resolver";
import { HcsDid } from "./hcs-did";
import { HcsDidMessage } from "./hcs-did-message";
import { HcsDidTopicListener } from "./hcs-did-topic-listener";

/**
 * Resolves the DID from Hedera network.
 */
export class HcsDidResolver {
    /**
     * Default time to wait before finishing resolution and after the last message was received.
     */
    public static DEFAULT_TIMEOUT: Long = Long.fromInt(30000);

    protected topicId: TopicId;
    protected results: Map<string, HcsDid>;

    private lastMessageArrivalTime: Long;
    private resultsHandler: (input: Map<string, HcsDid>) => void;
    private errorHandler: (input: Error) => void;
    private existingSignatures: string[];
    private listener: MessageListener<HcsDidMessage>;
    private noMoreMessagesTimeout: Long;

    /**
     * Instantiates a new DID resolver for the given DID topic.
     *
     * @param topicId The HCS DID topic ID.
     */
    constructor(topicId: TopicId) {
        this.topicId = topicId;
        this.results = new Map();

        this.noMoreMessagesTimeout = MessageResolver.DEFAULT_TIMEOUT;
        this.lastMessageArrivalTime = Long.fromInt(Date.now());
    }

    /**
     * Adds a DID to resolve.
     *
     * @param did The DID string.
     * @return This resolver instance.
     */
    public addDid(did: string): HcsDidResolver {
        if (did != null) {
            this.results.set(did, HcsDid.fromString(did));
        }
        return this;
    }

    /**
     * Adds multiple DIDs to resolve.
     *
     * @param dids The set of DID strings.
     * @return This resolver instance.
     */
    public addDids(dids: string[]): HcsDidResolver {
        if (dids) {
            dids.forEach((d) => this.addDid(d));
        }
        return this;
    }

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
    public whenFinished(handler: (input: Map<string, HcsDid>) => void): HcsDidResolver {
        this.resultsHandler = handler;
        return this;
    }

    /**
     * Defines a handler for errors when they happen during resolution.
     *
     * @param handler The error handler.
     * @return This resolver instance.
     */
    public onError(handler: (input: Error) => void): HcsDidResolver {
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
    public setTimeout(timeout: Long | number): HcsDidResolver {
        this.noMoreMessagesTimeout = Long.fromValue(timeout);
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

    protected matchesSearchCriteria(message: HcsDidMessage): boolean {
        return this.results.has(message.getDid());
    }

    protected processMessage(envelope: MessageEnvelope<HcsDidMessage>): void {
        const message: HcsDidMessage = envelope.open();

        // // Also skip messages that are older than the once collected or if we already have a DELETE message
        // const existing: MessageEnvelope<HcsDidMessage> = this.results.get(message.getDid());

        // const chackOperation =
        //     existing != null &&
        //     (TimestampUtils.lessThan(envelope.getConsensusTimestamp(), existing.getConsensusTimestamp()) ||
        //         (DidMethodOperation.DELETE == existing.open().getOperation() &&
        //             DidMethodOperation.DELETE != message.getOperation()));
        // if (chackOperation) {
        //     return;
        // }

        // // Preserve created and updated timestamps
        // message.setUpdated(envelope.getConsensusTimestamp());
        // if (DidMethodOperation.CREATE == message.getOperation()) {
        //     message.setCreated(envelope.getConsensusTimestamp());
        // } else if (existing != null) {
        //     message.setCreated(existing.open().getCreated());
        // }

        // Add valid message to the results
        this.results.get(message.getDid()).addMessage(message);
    }

    protected supplyMessageListener(): MessageListener<HcsDidMessage> {
        return new HcsDidTopicListener(this.topicId);
    }
}
