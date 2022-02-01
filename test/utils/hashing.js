const { HcsDid, Hashing } = require("../../dist");
const { expect } = require("chai");

describe("Util Multibase & Multicodec", function () {
    it("Test Valid Multibase base58btc with ed25519 pub key encode", async function () {
        const privateKey = HcsDid.generateDidRootKey();

        const publickeybytes = privateKey.publicKey.toBytes();
        const base58btcEncodedString = Hashing.multibase.encode(publickeybytes);
        const decodedPublicKeyBytes = Hashing.multibase.decode(base58btcEncodedString);

        // z is for base58btc & 6Mk is for ed25519 pub key
        expect(base58btcEncodedString.startsWith("z6Mk")).to.be.true;
        expect(decodedPublicKeyBytes).to.deep.equal(publickeybytes);
    });
});
