import { Client, Hbar, PrivateKey, TopicId } from "@hashgraph/sdk";
import {
    Hashing,
    HcsDid,
    HcsDidMessage,
    DidMethodOperation,
    HcsDidCreateDidOwnerEvent,
    MessageEnvelope,
    HcsDidTransaction,
    HcsDidTopicListener,
} from "../../dist";

describe("HcsDidTransaction", () => {
    const network = "testnet";
    const DID_TOPIC_ID1 = TopicId.fromString("0.0.2");
    const client = Client.forTestnet();
    const privateKey = PrivateKey.generate();
    const identifier = `did:hedera:${network}:${Hashing.multibase.encode(
        privateKey.publicKey.toBytes()
    )}_${DID_TOPIC_ID1}`;
    const TRANSACTION_FEE = new Hbar(2);

    describe("execute", () => {
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

        const envelope = new MessageEnvelope(message);
        const transaction = new HcsDidTransaction(envelope, DID_TOPIC_ID1);

        it("Validation Errors: signing & Transaction builder function missing", async () => {
            await expect(transaction.execute(client)).rejects.toThrow(
                "MessageTransaction execution failed: :\nSigning function is missing.\nTransaction builder is missing."
            );
        });

        it("Validation Errors: Transaction builder function missing", async () => {
            await expect(transaction.signMessage((msg) => privateKey.sign(msg)).execute(client)).rejects.toThrow(
                "MessageTransaction execution failed: :\nTransaction builder is missing."
            );
        });

        //TODO: mock dependencies and test submitTransaction
    });
});
