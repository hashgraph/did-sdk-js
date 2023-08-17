import { Hashing } from "../../../../utils/hashing";
import { HcsDid } from "../hcs-did";
import { HcsDidEventTargetName } from "./hcs-did-event-target-name";

export abstract class HcsDidEvent {
    protected SERVICE_ID_POSTFIX_REGEX = /^(service)\-[0-9]{1,}$/;
    protected KEY_ID_POSTFIX_REGEX = /^(key)\-[0-9]{1,}$/;
    protected OWNER_KEY_POSTFIX_REGEX = /^(did\-root\-key)$/;

    public abstract readonly targetName: HcsDidEventTargetName;

    constructor() {}

    abstract getId(): string;

    abstract toJsonTree(): any;

    abstract toJSON(): string;

    public getBase64() {
        return Hashing.base64.encode(this.toJSON());
    }

    static fromJsonTree(tree: any): HcsDidEvent {
        throw new Error("not implemented");
    }

    protected isDidValid(eventId: string) {
        const [identifier, id] = eventId?.split("#");

        if (!identifier) {
            return false;
        }

        HcsDid.parseIdentifier(identifier);
        return true;
    }

    protected isOwnerEventIdValid(eventId: string) {
        const [identifier, id] = eventId?.split("#");

        if (!identifier || !id) {
            return false;
        }

        HcsDid.parseIdentifier(identifier);

        return this.OWNER_KEY_POSTFIX_REGEX.test(id) !== false;
    }

    protected isServiceEventIdValid(eventId: string) {
        const [identifier, id] = eventId?.split("#");

        if (!identifier || !id) {
            return false;
        }

        HcsDid.parseIdentifier(identifier);

        return this.SERVICE_ID_POSTFIX_REGEX.test(id) !== false;
    }

    protected isKeyEventIdValid(eventId: string) {
        const [identifier, id] = eventId?.split("#");

        if (!identifier || !id) {
            return false;
        }

        HcsDid.parseIdentifier(identifier);

        return this.KEY_ID_POSTFIX_REGEX.test(id) !== false;
    }
}
