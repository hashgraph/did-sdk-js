import { DidParser, Hashing } from "../../dist";
import { PrivateKey } from "@hashgraph/sdk";

describe("DidParser", () => {
    it("throw an error when invalid did string provided", async () => {
        [
            null,
            "invalidDid1",
            "did:invalid",
            "did:invalidMethod:8LjUL78kFVnWV9rFnNCTE5bZdRmjm2obqJwS892jVLak_0.0.24352",
            "did:hedera:invalidNetwork:8LjUL78kFVnWV9rFnNCTE5bZdRmjm2obqJwS892jVLak_0.0.24352",
            "did:hedera:testnet:invalidAddress_0.0.24352_1.5.23462345",
            "did:hedera:testnet_1.5.23462345",
            "did:hedera:testnet:z6Mk8LjUL78kFVnWV9rFnNCTE5bZdRmjm2obqJwS892jVLak:unknown:parameter=1_missing",
            "did:hedera:testnet:z6Mk8LjUL78kFVnWV9rFnNCTE5bZdRmjm2obqJwS892jVLak_0.0.1=1",
            "did:hedera:testnet:z6Mk8LjUL78kFVnWV9rFnNCTE5bZdRmjm2obqJwS892jVLak:hedera:testnet:fid",
            "did:hedera:testnet:z6Mk8LjUL78kFVnWV9rFnNCTE5bZdRmjm2obqJwS892jVLak:unknownPart_0.0.1",
            "did:notHedera:testnet:z6Mk8LjUL78kFVnWV9rFnNCTE5bZdRmjm2obqJwS892jVLak_0.0.1",
        ].forEach((did) => {
            expect(() => {
                DidParser.parse(did);
            }).toThrowError();
        });
    });

    it("should part string did and provide HcsDid object", async () => {
        const privateKey = PrivateKey.generate();

        const publickeybytes = privateKey.publicKey.toBytes();
        const base58btcEncodedString = Hashing.multibase.encode(publickeybytes);

        [
            "did:hedera:testnet:z6Mkkcn1EDXc5vzpmvnQeCKpEswyrnQG7qq59k92gFRm1EGk_0.0.29643290",
            `did:hedera:testnet:${base58btcEncodedString}_0.0.1`,
        ].forEach((did) => {
            expect(DidParser.parse(did)).toBeDefined();
        });
    });
});
