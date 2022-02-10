import { PrivateKey } from "@hashgraph/sdk";
import { Hashing, HcsDidEventTargetName, HcsDidRevokeServiceEvent } from "../../../../dist";

describe("HcsDidRevokeServiceEvent", () => {
    const privateKey = PrivateKey.fromString(
        "302e020100300506032b6570042204209044d8f201e4b0aa7ba8ed577b0334b8cb6e38aad6c596171b5b1246737f5079"
    );
    const identifier = `did:hedera:testnet:${Hashing.multibase.encode(privateKey.publicKey.toBytes())}_0.0.29613327`;
    const event = new HcsDidRevokeServiceEvent(identifier + "#service-1");

    describe("#constructor", () => {
        it("targets Service", () => {
            expect(event.targetName).toEqual(HcsDidEventTargetName.SERVICE);
        });

        it("throws error if id is null", () => {
            let error = null;
            try {
                new HcsDidRevokeServiceEvent(null);
            } catch (err) {
                error = err;
            }

            expect(error).toBeInstanceOf(Error);
            expect(error.message).toEqual("Validation failed. Services args are missing");
        });

        it("throws error if id is not valid", () => {
            let error = null;
            try {
                new HcsDidRevokeServiceEvent(identifier);
            } catch (err) {
                error = err;
            }

            expect(error).toBeInstanceOf(Error);
            expect(error.message).toEqual("Event ID is invalid. Expected format: {did}#service-{integer}");
        });
    });

    describe("#getId", () => {
        it("returns id passed via constructor", () => {
            expect(event.getId()).toEqual(
                "did:hedera:testnet:z6MkogVzoGJMVVLhaz82cA5jZQKAAqUghhCrpzkSDFDwxfJa_0.0.29613327#service-1"
            );
        });
    });

    describe("#getBase64", () => {
        it("returns event data encoded in base64", () => {
            expect(event.getBase64()).toEqual(
                "eyJTZXJ2aWNlIjp7ImlkIjoiZGlkOmhlZGVyYTp0ZXN0bmV0Ono2TWtvZ1Z6b0dKTVZWTGhhejgyY0E1alpRS0FBcVVnaGhDcnB6a1NERkR3eGZKYV8wLjAuMjk2MTMzMjcjc2VydmljZS0xIn19"
            );
        });
    });

    describe("#toJsonTree", () => {
        it("returns event JSON structure", () => {
            expect(event.toJsonTree()).toEqual({
                Service: {
                    id: "did:hedera:testnet:z6MkogVzoGJMVVLhaz82cA5jZQKAAqUghhCrpzkSDFDwxfJa_0.0.29613327#service-1",
                },
            });
        });
    });

    describe("#toJSON", () => {
        expect(event.toJSON()).toEqual(
            '{"Service":{"id":"did:hedera:testnet:z6MkogVzoGJMVVLhaz82cA5jZQKAAqUghhCrpzkSDFDwxfJa_0.0.29613327#service-1"}}'
        );
    });

    describe("#fromJsonTree", () => {
        it("rebuilds HcsDidRevokeServiceEvent object", () => {
            const eventFromJson = HcsDidRevokeServiceEvent.fromJsonTree({
                id: "did:hedera:testnet:z6MkogVzoGJMVVLhaz82cA5jZQKAAqUghhCrpzkSDFDwxfJa_0.0.29613327#service-1",
            });

            expect(eventFromJson).toBeInstanceOf(HcsDidRevokeServiceEvent);
            expect(eventFromJson.toJsonTree()).toEqual({
                Service: {
                    id: "did:hedera:testnet:z6MkogVzoGJMVVLhaz82cA5jZQKAAqUghhCrpzkSDFDwxfJa_0.0.29613327#service-1",
                },
            });
        });
    });
});
