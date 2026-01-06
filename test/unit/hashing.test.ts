import { PrivateKey } from "@hashgraph/sdk";
import { Hashing } from "../../dist";

describe("Util Multibase", () => {
    it("Test Valid Multibase base58btc with ed25519 pub key encode", async () => {
        const privateKey = PrivateKey.generate();

        const publickeybytes = privateKey.publicKey.toBytes();
        const base58btcEncodedString = Hashing.multibase.encode(publickeybytes);
        const decodedPublicKeyBytes = Hashing.multibase.decode(base58btcEncodedString);

        // z is for base58btc
        expect(base58btcEncodedString.startsWith("z")).toBeTruthy();
        expect(decodedPublicKeyBytes).toStrictEqual(publickeybytes);
    });
});
