import { Timestamp, TopicMessage, TopicMessageQuery } from "@hashgraph/sdk";

export function delay(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

export async function delayUntil(condition: () => Promise<boolean>, timeoutMs: number): Promise<boolean> {
    return new Promise(async (resolve) => {
        const startTime = Date.now();

        const checkCondition = async () => {
            try {
                const isConditionMet = await condition();

                if (isConditionMet) {
                    resolve(true);
                } else if (Date.now() - startTime >= timeoutMs) {
                    resolve(false);
                } else {
                    setTimeout(checkCondition, 3000);
                }
            } catch (error) {
                resolve(false);
            }
        };

        checkCondition();
    });
}

export async function readTopicMessages(topicId, client) {
    const messages: TopicMessage[] = [];

    const query = new TopicMessageQuery()
        .setTopicId(topicId)
        .setStartTime(new Timestamp(0, 0))
        .setEndTime(Timestamp.fromDate(new Date()));

    query.setMaxBackoff(2000);
    query.setMaxAttempts(5);

    const querySubcription = query.subscribe(client, null, (msg) => {
        messages.push(msg);
    });

    await delay(2000);

    querySubcription.unsubscribe();

    return messages;
}
