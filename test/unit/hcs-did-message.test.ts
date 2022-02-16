import { Client, PrivateKey, TopicId } from "@hashgraph/sdk";
import crypto from "crypto";
import { DidMethodOperation, Hashing, HcsDid, HcsDidCreateDidOwnerEvent, HcsDidMessage } from "../../dist";

const network = "testnet";
const DID_TOPIC_ID1 = TopicId.fromString("0.0.2");
const DID_TOPIC_ID2 = TopicId.fromString("0.0.3");

const encrypt = (plainText, key) => {
    const cipher = crypto.createCipheriv(
        "aes-128-ecb",
        crypto.createHash("sha256").update(String(key)).digest("base64").substr(0, 16),
        null
    );
    return Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]).toString("base64");
};

const decrypt = (cipherText, key) => {
    const cipher = crypto.createDecipheriv(
        "aes-128-ecb",
        crypto.createHash("sha256").update(String(key)).digest("base64").substr(0, 16),
        null
    );
    return Buffer.concat([cipher.update(cipherText, "base64"), cipher.final()]).toString("utf8");
};

exports.encrypt = encrypt;
exports.decrypt = decrypt;

describe("HcsDidMessage", () => {
    const client = Client.forTestnet();
    const privateKey = PrivateKey.generate();
    const identifier = `did:hedera:${network}:${Hashing.multibase.encode(
        privateKey.publicKey.toBytes()
    )}_${DID_TOPIC_ID1}`;

    it("Test Valid Message", () => {
        const did = new HcsDid({ identifier: identifier, privateKey: privateKey, client: client });

        const message = new HcsDidMessage(
            DidMethodOperation.CREATE,
            did.getIdentifier(),
            new HcsDidCreateDidOwnerEvent(
                did.getIdentifier() + "#did-root-key",
                did.getIdentifier(),
                privateKey.publicKey
            )
        );

        expect(message.isValid(DID_TOPIC_ID1)).toEqual(true);
    });

    it("Test Invalid Did", () => {
        const did = new HcsDid({ identifier: identifier, privateKey: privateKey, client: client });

        const message = new HcsDidMessage(
            DidMethodOperation.CREATE,
            "invalid_did###",
            new HcsDidCreateDidOwnerEvent(
                did.getIdentifier() + "#did-root-key",
                did.getIdentifier(),
                privateKey.publicKey
            )
        );

        expect(message.isValid()).toEqual(false);
    });

    it("Test Invalid Topic", () => {
        const did = new HcsDid({ identifier: identifier, privateKey: privateKey, client: client });

        const message = new HcsDidMessage(
            DidMethodOperation.CREATE,
            did.getIdentifier(),
            new HcsDidCreateDidOwnerEvent(
                did.getIdentifier() + "#did-root-key",
                did.getIdentifier(),
                privateKey.publicKey
            )
        );

        expect(message.isValid(DID_TOPIC_ID1)).toEqual(true);
        expect(message.isValid(DID_TOPIC_ID2)).toEqual(false);
    });

    it("Test Missing Data", () => {
        const did = new HcsDid({ identifier: identifier, privateKey: privateKey, client: client });

        let message = new HcsDidMessage(
            null,
            did.getIdentifier(),
            new HcsDidCreateDidOwnerEvent(
                did.getIdentifier() + "#did-root-key",
                did.getIdentifier(),
                privateKey.publicKey
            )
        );

        expect(message.getOperation()).toEqual(null);
        expect(message.isValid()).toEqual(false);

        message = new HcsDidMessage(
            DidMethodOperation.CREATE,
            null,
            new HcsDidCreateDidOwnerEvent(
                did.getIdentifier() + "#did-root-key",
                did.getIdentifier(),
                privateKey.publicKey
            )
        );

        expect(message.getDid()).toEqual(null);
        expect(message.isValid()).toEqual(false);

        message = new HcsDidMessage(DidMethodOperation.CREATE, did.getIdentifier(), null);

        expect(message.getEvent()).toEqual(null);
        expect(message.isValid()).toEqual(false);

        message = new HcsDidMessage(
            DidMethodOperation.CREATE,
            did.getIdentifier(),
            new HcsDidCreateDidOwnerEvent(
                did.getIdentifier() + "#did-root-key",
                did.getIdentifier(),
                privateKey.publicKey
            )
        );

        expect(message.isValid()).toEqual(true);
    });
});
