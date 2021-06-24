const {
    CredentialSubject
} = require("../../dist");

/**
 * Example Credential.
 */
class DemoAccessCredential extends CredentialSubject {
    static ACCESS_GRANTED = "granted";
    static ACCESS_DENIED = "denied";

    blueLevel;
    greenLevel;
    redLevel;

    /**
     * Creates a new credential instance.
     *
     * @param did   Credential Subject DID.
     * @param blue  Access to blue level granted or denied.
     * @param green Access to green level granted or denied.
     * @param red   Access to red level granted or denied.
     */
    constructor(did, blue, green, red) {
        super();
        this.id = did;
        this.blueLevel = blue ? DemoAccessCredential.ACCESS_GRANTED : DemoAccessCredential.ACCESS_DENIED;
        this.greenLevel = green ? DemoAccessCredential.ACCESS_GRANTED : DemoAccessCredential.ACCESS_DENIED;
        this.redLevel = red ? DemoAccessCredential.ACCESS_GRANTED : DemoAccessCredential.ACCESS_DENIED;
    }

    getBlueLevel() {
        return this.blueLevel;
    }

    getGreenLevel() {
        return this.greenLevel;
    }

    getRedLevel() {
        return this.redLevel;
    }

    toJsonTree() {
        const json = super.toJsonTree();
        json["blueLevel"] = this.blueLevel;
        json["greenLevel"] = this.greenLevel;
        json["redLevel"] = this.redLevel;
        return json;
    }

    toJson() {
        return JSON.stringify(this.toJsonTree());
    }

    static fromJsonTree(json) {
        const result = new DemoAccessCredential(null, null, null, null);
        super.fromJsonTree(json, result);
        result.blueLevel = json["blueLevel"];
        result.greenLevel = json["greenLevel"];
        result.redLevel = json["redLevel"];
        return result;
    }

    static fromJson(json) {
        const root = JSON.parse(json);
        return this.fromJsonTree(root);
    }

    static toJsonTree(item) {
        return item ? item.toJsonTree() : null;
    }

    static toJson(item) {
        return JSON.stringify(this.toJsonTree(item));
    }
}

exports.DemoAccessCredential = DemoAccessCredential;
