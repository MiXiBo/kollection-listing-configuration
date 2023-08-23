const config = require("./config.json");
const { Provider, Signer, Contract } = require("koilib");
const abi = require("./collections-abi.json");

const provider = new Provider(["https://api.koinos.io/"]);
const signer = Signer.fromWif(config.owner_pk);
signer.provider = provider;

const nft = new Contract({
  id: config.contract_address,
  abi: abi,
  provider,
  signer,
});

async function start() {
  try {
    await nft.functions.set_royalties({
      value: config.royalties
    })
    console.log("done")
  } catch (error) {
    console.log(error)
  }
}

start()