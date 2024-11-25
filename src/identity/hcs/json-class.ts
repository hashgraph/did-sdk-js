export type JsonClass<U> = {
    fromJsonTree(json: any, result?: U): U;
};
