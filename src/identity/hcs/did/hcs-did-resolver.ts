import { TopicId } from "@hashgraph/sdk";
import { TimestampUtils } from "../../../utils/timestamp-utils";
import { DidMethodOperation } from "../../did-method-operation";
import { MessageEnvelope } from "../message-envelope";
import { MessageListener } from "../message-listener";
import { MessageResolver } from "../message-resolver";
import { HcsDidMessage } from "./hcs-did-message";
import { HcsDidTopicListener } from "./hcs-did-topic-listener";

/**
 * Resolves the DID from Hedera network.
 */
export class HcsDidResolver extends MessageResolver<HcsDidMessage> {
    /**
     * Instantiates a new DID resolver for the given DID topic.
     *
     * @param topicId The HCS DID topic ID.
     */
    constructor(topicId: TopicId) {
        super(topicId);
    }

    /**
     * Adds a DID to resolve.
     *
     * @param did The DID string.
     * @return This resolver instance.
     */
    public addDid(did: string): HcsDidResolver {
        if (did != null) {
            this.results.set(did, null);
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

    protected override matchesSearchCriteria(message: HcsDidMessage): boolean {
        return this.results.has(message.getDid());
    }

    protected override processMessage(envelope: MessageEnvelope<HcsDidMessage>): void {
        const message: HcsDidMessage = envelope.open();

        // Also skip messages that are older than the once collected or if we already have a DELETE message
        const existing: MessageEnvelope<HcsDidMessage> = this.results.get(message.getDid());

        const chackOperation =
            existing != null &&
            (TimestampUtils.lessThan(envelope.getConsensusTimestamp(), existing.getConsensusTimestamp()) ||
                (DidMethodOperation.DELETE == existing.open().getOperation() &&
                    DidMethodOperation.DELETE != message.getOperation()));
        if (chackOperation) {
            return;
        }

        // Preserve created and updated timestamps
        message.setUpdated(envelope.getConsensusTimestamp());
        if (DidMethodOperation.CREATE == message.getOperation()) {
            message.setCreated(envelope.getConsensusTimestamp());
        } else if (existing != null) {
            message.setCreated(existing.open().getCreated());
        }

        // Add valid message to the results
        this.results.set(message.getDid(), envelope);
    }

    protected override supplyMessageListener(): MessageListener<HcsDidMessage> {
        return new HcsDidTopicListener(this.topicId);
    }
}
