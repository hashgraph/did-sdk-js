import { PublicKey } from "@hashgraph/sdk";
import { Hashing } from "../../..";
import { HcsDid } from "./hcs-did";
/**
 * Represents a root key of HCS Identity DID.
 * That is a public key of type Ed25519VerificationKey2018 compatible with a single publicKey entry of a DID Document.
 */
export class HcsDidRootKey {
    public static DID_ROOT_KEY_NAME = "#did-root-key";
    public static DID_ROOT_KEY_TYPE = "Ed25519VerificationKey2018";

    private id: string;
    private type: string;
    private controller: string;
    private publicKeyMultibase: string;

    /**
     * Creates a {@link HcsDidRootKey} object from the given {@link HcsDid} DID and it's root public key.
     *
     * @param did        The {@link HcsDid} DID object.
     * @param didRootKey The public key from which the DID was derived.
     * @return The {@link HcsDidRootKey} object.
     */
    public static fromHcsIdentity(did: HcsDid, didRootKey: PublicKey): HcsDidRootKey {
        if (!did) {
            throw new Error("DID cannot be " + did);
        }
        if (!didRootKey) {
            throw new Error("DID root key cannot be " + didRootKey);
        }
        if (HcsDid.publicKeyToIdString(didRootKey) !== did.getIdString()) {
            throw new Error("The specified DID does not correspond to the given DID root key");
        }
        const result = new HcsDidRootKey();
        result.controller = did.toDid();
        result.id = result.controller + HcsDidRootKey.DID_ROOT_KEY_NAME;
        result.publicKeyMultibase = Hashing.multibase.encode(didRootKey.toBytes());
        result.type = HcsDidRootKey.DID_ROOT_KEY_TYPE;

        return result;
    }

    public static fromId(id: string): HcsDidRootKey {
        if (id == null) {
            throw new Error("id cannot be null");
        }
        const didString = id.replace(new RegExp(HcsDidRootKey.DID_ROOT_KEY_NAME + "$"), "");
        if (didString == null) {
            throw new Error("DID cannot be null");
        }
        const did = HcsDid.fromString(didString);

        const result = new HcsDidRootKey();
        result.controller = did.toDid();
        result.id = result.controller + this.DID_ROOT_KEY_NAME;
        result.publicKeyMultibase = null;
        result.type = this.DID_ROOT_KEY_TYPE;
        return result;
    }

    public getId(): string {
        return this.id;
    }

    public getType(): string {
        return this.type;
    }

    public getController(): string {
        return this.controller;
    }

    public getPublicKeyMultibase(): string {
        return this.publicKeyMultibase;
    }

    public toJsonTree(): any {
        const result: any = {};
        result.id = this.id;
        result.type = this.type;
        result.controller = this.controller;
        result.publicKeyMultibase = this.publicKeyMultibase;
        return result;
    }

    public toJSON(): string {
        return JSON.stringify(this.toJsonTree());
    }

    public static fromJsonTree(json: any): HcsDidRootKey {
        const result = new HcsDidRootKey();
        result.id = json.id;
        result.type = json.type;
        result.controller = json.controller;
        result.publicKeyMultibase = json.publicKeyMultibase;
        return result;
    }

    public static fromJson(json: string): HcsDidRootKey {
        return HcsDidRootKey.fromJsonTree(JSON.parse(json));
    }
}
