import { Hashing } from "../../dist";
import { PrivateKey } from "@hashgraph/sdk";

describe("Util Multibase & Multicodec", () => {
    it("Test Valid Multibase base58btc with ed25519 pub key encode", async () => {
        const privateKey = PrivateKey.generate();

        const publickeybytes = privateKey.publicKey.toBytes();
        const base58btcEncodedString = Hashing.multibase.encode(publickeybytes);
        const decodedPublicKeyBytes = Hashing.multibase.decode(base58btcEncodedString);

        // z is for base58btc & 6Mk is for ed25519 pub key
        expect(base58btcEncodedString.startsWith("z6Mk")).toBeTruthy();
        expect(decodedPublicKeyBytes).toStrictEqual(publickeybytes);
    });
});
