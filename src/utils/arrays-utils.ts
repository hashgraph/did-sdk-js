export class ArraysUtils {
    public static equals(a: Uint8Array, b: Uint8Array): boolean {
        if (a == b) {
            return true;
        }
        if (!a || !b) {
            return false;
        }
        if (a.length != b.length) {
            return false;
        }
        for (let i = 0; i < a.length; i++) {
            if (a[i] != b[i]) return false;
        }
        return true;
    }

    public static toString(array: number[] | Uint8Array): string {
        return Buffer.from(array).toString("utf8");
    }

    public static fromString(text: string): Uint8Array {
        return new Uint8Array(Buffer.from(text, "utf8"));
    }
}
