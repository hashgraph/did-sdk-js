const OPERATOR_ID = process.env.OPERATOR_ID;
const OPERATOR_KEY = process.env.OPERATOR_KEY;
// testnet, previewnet, mainnet
const NETWORK = process.env.NETWORK || 'testnet';

// hedera, kabuto (note kabuto not available on previewnet)
const MIRROR_PROVIDER = process.env.MIRROR_PROVIDER || 'hedera';

if (!OPERATOR_ID || !/^\d+\.\d+\.\d+$/.test(OPERATOR_ID)) {
  console.error('Missing or invalid OPERATOR_ID');
  process.exit(1);
}

if (!OPERATOR_KEY) {
  console.error('Missing required OPERATOR_KEY');
  process.exit(1);
}

if (!NETWORK || !/^(mainnet|previewnet|testnet)$/.test(NETWORK)) {
  console.error('Missing or invalid NETWORK');
  process.exit(1);
}

if (!MIRROR_PROVIDER || !/^(hedera|kabuto)$/.test(MIRROR_PROVIDER)) {
  console.error('Missing or invalid MIRROR_PROVIDER');
  process.exit(1);
}

module.exports = {
    OPERATOR_ID,
    OPERATOR_KEY,
    NETWORK,
    MIRROR_PROVIDER
}
