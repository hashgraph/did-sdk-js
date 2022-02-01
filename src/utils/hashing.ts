import * as crypto from "crypto";
import { base58btc } from "multiformats/bases/base58";
import { Base64 } from "js-base64";
import { MultibaseEncoder, MultibaseDecoder } from "multiformats/bases/interface";
import { Ed25519PubCodec } from "./ed25519PubCodec";
import { BlockCodec } from "multiformats/codecs/interface";

export class Hashing {
    public static readonly sha256 = {
        digest: function (data: Uint8Array | string): Uint8Array {
            const sha256 = crypto
                .createHash("sha256") // may need to change in the future.
                .update(data)
                .digest();
            return sha256;
        },
    };

    public static readonly base64 = {
        decode: function (encodedString: string): string {
            return Base64.fromBase64(encodedString);
        },
        encode: function (decodedBytes: string): string {
            return Base64.toBase64(decodedBytes);
        },
    };

    /**
     * @returns Multibase [MULTIBASE] base58-btc encoded value that is a concatenation of the
     * Multicodec [MULTICODEC] identifier for the public key type and the raw bytes associated with the public key format.
     * MULTIBASE(base58-btc, MULTICODEC(public-key-type, raw-public-key-bytes))
     * https://github.com/multiformats/multibase
     * https://www.w3.org/TR/did-core/#dfn-publickeymultibase
     */
    public static readonly multibase = {
        encode: function (
            data: Uint8Array,
            base: MultibaseEncoder<string> = base58btc,
            codec: BlockCodec<number, Uint8Array> = new Ed25519PubCodec()
        ): string {
            // MULTICODEC(public-key-type, raw-public-key-bytes)
            return base.encode(codec.encode(data));
        },
        decode: function (
            data: string,
            base: MultibaseDecoder<string> = base58btc,
            codec: BlockCodec<number, Uint8Array> = new Ed25519PubCodec()
        ): Uint8Array {
            return codec.decode(base.decode(data));
        },
    };
}
