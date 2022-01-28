import { Timestamp } from "@hashgraph/sdk";
import Long from "long";
import { TimestampUtils } from "../../utils/timestamp-utils";

export type Encrypter<T> = (message: T) => T;
export type Decrypter<T> = (message: T, consensusTime: Timestamp) => T;
export type Signer<T> = (message: T) => T;

export class Message {
    private static serialVersionUID = Long.fromInt(1);

    protected timestamp: Timestamp;

    constructor() {
        this.timestamp = TimestampUtils.now();
    }

    public getTimestamp(): Timestamp {
        return this.timestamp;
    }

    public toJsonTree(): any {
        const result: any = {};
        result.timestamp = TimestampUtils.toJSON(this.timestamp);
        return result;
    }

    public toJSON(): string {
        return JSON.stringify(this.toJsonTree());
    }

    public static fromJsonTree(tree: any, result?: Message): Message {
        if (!result) result = new Message();
        result.timestamp = TimestampUtils.fromJson(tree.timestamp);
        return result;
    }

    public static fromJson(json: string): Message {
        return Message.fromJsonTree(JSON.parse(json));
    }
}
