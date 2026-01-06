// @ts-check

import { BlockCodec, ByteView } from "multiformats/codecs/interface";
import varint from "varint";

/**
 * Ed25519PubCodec MULTICODEC(public-key-type, raw-public-key-bytes)
 * https://github.com/multiformats/js-multiformats#multicodec-encoders--decoders--codecs
 * Implementation of BlockCodec interface which implements both BlockEncoder and BlockDecoder.
 * @template T
 * @typedef {import('./interface').ByteView<T>} ByteView
 */

export class Ed25519PubCodec implements BlockCodec<number, Uint8Array> {
    // values retrieved from https://raw.githubusercontent.com/multiformats/multicodec/master/table.csv
    name: string = "ed25519-pub";
    code: number = 0xed;
    encode(data: Uint8Array): ByteView<Uint8Array> {
        const prefix = this.varintEncode(this.code);
        return this.concat([prefix, data], prefix.length + data.length);
    }
    decode(bytes: ByteView<Uint8Array>): Uint8Array {
        return this.rmPrefix(bytes);
    }

    /**
     * Returns a new Uint8Array created by concatenating the passed ArrayLikes
     *
     * @param {Array<ArrayLike<number>>} arrays
     * @param {number} [length]
     */
    private concat(arrays: Array<ArrayLike<number>>, length: number) {
        if (!length) {
            length = arrays.reduce((acc, curr) => acc + curr.length, 0);
        }

        const output = new Uint8Array(length);
        let offset = 0;

        for (const arr of arrays) {
            output.set(arr, offset);
            offset += arr.length;
        }

        return output;
    }

    /**
     * @param {number} num
     */
    private varintEncode(num: number) {
        return Uint8Array.from(varint.encode(num));
    }

    /**
     * Decapsulate the multicodec-packed prefix from the data.
     *
     * @param {Uint8Array} data
     * @returns {Uint8Array}
     */
    private rmPrefix(data: Uint8Array): Uint8Array {
        varint.decode(/** @type {Buffer} */ data);
        return data.slice(varint.decode.bytes);
    }
}
