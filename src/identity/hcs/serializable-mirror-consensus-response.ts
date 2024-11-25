import Long from "long";
import { Timestamp, TopicMessage } from "@hashgraph/sdk";
import { ArraysUtils } from "../../utils/arrays-utils";
import { TimestampUtils } from "../../utils/timestamp-utils";

export class SerializableMirrorConsensusResponse {
    private static serialVersionUID = Long.fromInt(1);

    public consensusTimestamp: Timestamp;
    public message: Uint8Array;
    public runningHash: Uint8Array;
    public sequenceNumber: Long;

    constructor(response: TopicMessage) {
        this.consensusTimestamp = response.consensusTimestamp;
        this.message = response.contents;
        this.runningHash = response.runningHash;
        this.sequenceNumber = response.sequenceNumber;
    }

    public toString(): string {
        return (
            "ConsensusMessage{" +
            "consensusTimestamp=" +
            TimestampUtils.toJSON(this.consensusTimestamp) +
            ", message=" +
            ArraysUtils.toString(this.message) +
            ", runningHash=" +
            ArraysUtils.toString(this.runningHash) +
            ", sequenceNumber=" +
            this.sequenceNumber.toNumber() +
            "}"
        );
    }

    public toJsonTree(): any {
        const result: any = {};
        result.consensusTimestamp = {
            seconds: this.consensusTimestamp.seconds,
            nanos: this.consensusTimestamp.nanos,
        };
        result.message = this.message.toString();
        result.runningHash = this.runningHash.toString();
        result.sequenceNumber = this.sequenceNumber.toString();
        return result;
    }

    public toJSON(): string {
        return JSON.stringify(this.toJsonTree());
    }
}
