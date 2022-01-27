export function Sleep(sleepTime: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, sleepTime);
    });
}
