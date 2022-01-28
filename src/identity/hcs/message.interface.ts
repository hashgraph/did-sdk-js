export interface Serialize {
    toJsonTree: () => any;
    toJSON(): () => string;
}
