import {Client, FileCreateTransaction, Hbar, PublicKey, TopicCreateTransaction, TopicId} from "@hashgraph/sdk";
import {HcsIdentityNetwork} from "./hcs-identity-network";

export class HcsIdentityNetworkBuilder {
    private appnetName: string;
    private didTopicId: TopicId;
    private vcTopicId: TopicId;
    private network: string;
    private didServers: string[];
    private publicKey: PublicKey;
    private maxTransactionFee: Hbar = new Hbar(2);
    private didTopicMemo: string = '';
    private vcTopicMemo: string = '';

    public async execute(client: Client): Promise<HcsIdentityNetwork> {
        const didTopicCreateTransaction = new TopicCreateTransaction()
            .setMaxTransactionFee(this.maxTransactionFee)
            .setTopicMemo(this.didTopicMemo);

        if (this.publicKey) {
            didTopicCreateTransaction.setAdminKey(this.publicKey);
        }

        const didTxId = await didTopicCreateTransaction.execute(client);
        this.didTopicId = (await didTxId.getReceipt(client)).topicId;

        const vcTopicCreateTransaction = new TopicCreateTransaction()
            .setMaxTransactionFee(this.maxTransactionFee)
            .setTopicMemo(this.vcTopicMemo);

        if (this.publicKey) {
            vcTopicCreateTransaction.setAdminKey(this.publicKey);
        }

        const vcTxId = await vcTopicCreateTransaction.execute(client);
        this.vcTopicId = (await vcTxId.getReceipt(client)).topicId;

        return HcsIdentityNetwork.fromHcsDid(this.network, this.didTopicId, this.vcTopicId);
    }

    public addAppnetDidServer(serverUrl: string): HcsIdentityNetworkBuilder {
        if (!this.didServers) {
            this.didServers = [];
        }

        if (this.didServers.indexOf(serverUrl) == -1) {
            this.didServers.push(serverUrl);
        }

        return this;
    }

    public setAppnetName(appnetName: string): HcsIdentityNetworkBuilder {
        this.appnetName = appnetName;
        return this;
    }

    public setDidTopicMemo(didTopicMemo: string): HcsIdentityNetworkBuilder {
        this.didTopicMemo = didTopicMemo;
        return this;
    }

    public setVCTopicMemo(vcTopicMemo: string): HcsIdentityNetworkBuilder {
        this.vcTopicMemo = vcTopicMemo;
        return this;
    }

    public setDidTopicId(didTopicId: TopicId): HcsIdentityNetworkBuilder {
        this.didTopicId = didTopicId;
        return this;
    }

    public setVCTopicId(vcTopicId: TopicId): HcsIdentityNetworkBuilder {
        this.vcTopicId = vcTopicId;
        return this;
    }

    public setMaxTransactionFee(maxTransactionFee: Hbar): HcsIdentityNetworkBuilder {
        this.maxTransactionFee = maxTransactionFee;
        return this;
    }

    public setPublicKey(publicKey: PublicKey): HcsIdentityNetworkBuilder {
        this.publicKey = publicKey;
        return this;
    }

    public setNetwork(network: string): HcsIdentityNetworkBuilder {
        this.network = network;
        return this;
    }
}
