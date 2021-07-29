const {OPERATOR_KEY, OPERATOR_ID, NETWORK} = require("./variables");
const {
    AccountId,
    PrivateKey,
    Client,
    FileCreateTransaction,
    Hbar,
    TopicInfoQuery
} = require('@hashgraph/sdk');

const {
    AddressBook,
    HcsDid,
    HcsIdentityNetworkBuilder,
    HcsIdentityNetwork
} = require("../dist");

const {assert} = require('chai');

const FEE = new Hbar(2);
const ADDRESS_BOOK_JSON = "{\"appnetName\":\"Test Identity SDK appnet\",\"didTopicId\":\"0.0.214919\",\"vcTopicId\":\"0.0.214920\",\"appnetDidServers\":[\"http://localhost:3000/api/v1\"]}";

let client,
    operatorId,
    operatorKey,
    addressBookFileId,
    network;

describe('HcsIdentityNetwork', function() {
    before(async function() {
        this.timeout(60000);

        operatorId = AccountId.fromString(OPERATOR_ID);
        operatorKey = PrivateKey.fromString(OPERATOR_KEY);
        network = NETWORK;
        client = Client.forTestnet();
        client.setMirrorNetwork(["hcs." + network + ".mirrornode.hedera.com:5600"]);
        client.setOperator(operatorId, operatorKey);

        const response = await new FileCreateTransaction()
            .setContents(ADDRESS_BOOK_JSON)
            .setKeys([operatorKey.publicKey])
            .setMaxTransactionFee(FEE)
            .execute(client);

        const receipt = await response.getReceipt(client);
        addressBookFileId = receipt.fileId;
    });

    it('Test Create Identity Network', async function() {
        this.timeout(60000);
        const appnetName = 'Test Identity SDK appnet';
        const didServerUrl = 'http://localhost:3000/api/v1';
        const didTopicMemo = 'Test Identity SDK appnet DID topic';
        const vcTopicMemo = 'Test Identity SDK appnet VC topic';

        const didNetwork = await new HcsIdentityNetworkBuilder()
            .setNetwork(network)
            .setAppnetName(appnetName)
            .addAppnetDidServer(didServerUrl)
            .setPublicKey(operatorKey.publicKey)
            .setMaxTransactionFee(FEE)
            .setDidTopicMemo(didTopicMemo)
            .setVCTopicMemo(vcTopicMemo)
            .execute(client);

        assert.exists(didNetwork);
        assert.exists(didNetwork.getAddressBook());

        const addressBook = didNetwork.getAddressBook();
        assert.exists(addressBook.getDidTopicId());
        assert.exists(addressBook.getVcTopicId());
        assert.exists(addressBook.getAppnetDidServers());
        assert.exists(addressBook.getFileId());
        assert.equal(addressBook.getAppnetName(), appnetName);
        assert.equal(didNetwork.getNetwork(), network);

        const didTopicInfo = await new TopicInfoQuery()
            .setTopicId(didNetwork.getDidTopicId())
            .execute(client);

        assert.exists(didTopicInfo);
        assert.equal(didTopicInfo.topicMemo, didTopicMemo);

        const vcTopicInfo = await new TopicInfoQuery()
            .setTopicId(didNetwork.getVcTopicId())
            .execute(client);

        assert.exists(vcTopicInfo);
        assert.equal(vcTopicInfo.topicMemo, vcTopicMemo);

        const createdNetwork = await HcsIdentityNetwork.fromAddressBookFile(client, network, addressBook.getFileId());
        assert.exists(createdNetwork);
        assert.equal(addressBook.toJSON(), createdNetwork.getAddressBook().toJSON());
    });

    it('Test Init Network From Json AddressBook', async function() {
        this.timeout(60000);
        const addressBook = AddressBook.fromJson(ADDRESS_BOOK_JSON, addressBookFileId);
        const didNetwork = HcsIdentityNetwork.fromAddressBook(network, addressBook);

        assert.exists(didNetwork);
        assert.exists(didNetwork.getAddressBook().getFileId());
        assert.equal(didNetwork.getNetwork(), network);
    });

    it('Test Init Network From Did', async function() {
        this.timeout(60000);
        const did = new HcsDid(network, HcsDid.generateDidRootKey().publicKey, addressBookFileId);

        const didNetwork = await HcsIdentityNetwork.fromHcsDid(client, did);

        assert.exists(didNetwork);
        assert.exists(didNetwork.getAddressBook().getFileId());
        assert.equal(didNetwork.getNetwork(), network);
        assert.equal(ADDRESS_BOOK_JSON, didNetwork.getAddressBook().toJSON());
    });

    it('Test Generate Did For Network', async function() {
        this.timeout(60000);

        function checkTestGenerateDidForNetwork(did, publicKey, didTopicId, withTid) {
            assert.exists(did);
            assert.equal(HcsDid.publicKeyToIdString(publicKey), did.getIdString());
            assert.equal(did.getNetwork(), network);
            assert.equal(did.getAddressBookFileId(), addressBookFileId);
            if (withTid) {
                assert.equal(did.getDidTopicId().toString(), didTopicId)
            } else {
                assert.notExists(did.getDidTopicId());
            }
            assert.equal(did.getMethod(), HcsDid.DID_METHOD);
        }

        const addressBook = AddressBook.fromJson(ADDRESS_BOOK_JSON, addressBookFileId);
        const didNetwork = HcsIdentityNetwork.fromAddressBook(network, addressBook);

        let did = didNetwork.generateDid(true);
        assert.exists(did.getPrivateDidRootKey());

        let publicKey = did.getPrivateDidRootKey().publicKey;
        checkTestGenerateDidForNetwork(did, publicKey, addressBook.getDidTopicId(), true);

        did = didNetwork.generateDid(false);
        assert.exists(did.getPrivateDidRootKey());

        publicKey = did.getPrivateDidRootKey().publicKey;
        checkTestGenerateDidForNetwork(did, publicKey, addressBook.getDidTopicId(), false);

        did = didNetwork.generateDid(true);
        assert.exists(did.getPrivateDidRootKey());
        publicKey = did.getPrivateDidRootKey().publicKey;
        checkTestGenerateDidForNetwork(did, publicKey, addressBook.getDidTopicId(), true);

        did = didNetwork.generateDid(false);
        assert.exists(did.getPrivateDidRootKey());
        publicKey = did.getPrivateDidRootKey().publicKey;
        checkTestGenerateDidForNetwork(did, publicKey, addressBook.getDidTopicId(), false);

        publicKey = HcsDid.generateDidRootKey().publicKey;
        did = didNetwork.generateDid(publicKey, true);
        checkTestGenerateDidForNetwork(did, publicKey, addressBook.getDidTopicId(), true);

        publicKey = HcsDid.generateDidRootKey().publicKey;
        did = didNetwork.generateDid(publicKey, false);
        checkTestGenerateDidForNetwork(did, publicKey, addressBook.getDidTopicId(), false);
    });
});
