const config = require("./config.json");
const { Provider, Signer, Contract, utils } = require("koilib");
const tokenAbi = require("./collections-abi.json");
const marketplaceAbi = require("./marketplace-abi.json");

let provider = new Provider(["https://harbinger-api.koinos.io"]);

const MAINNET = config.mainnet;
const CHECK_APPROVE = config.check_approve;
const SET_SALE = config.set_sale;
const CANCEL_ORDER = config.cancel_order;
const SET_ROYALITIES = config.set_royalities
const item_count = config.items;

let contract_market = config.contract_market_testnet;
let contract_address = config.nft_testnet;
let koin = config.koin_testnet

if(MAINNET){
  contract_market = config.contract_market_mainnet;
  contract_address = config.nft_mainnet;
  koin = config.koin_mainnet;
  provider = new Provider(["https://api.koinos.io"]);
} 

const signer = Signer.fromWif(config.owner_pk);
signer.provider = provider;


const nft = new Contract({
  id: contract_address,
  abi: tokenAbi,
  provider,
  signer,
});


const market = new Contract({
  id: contract_market,
  abi: marketplaceAbi,
  provider,
  signer,
});

function getHex(value){
  let result = "0x"
  let value_string = String(value)
  for(let i=0; i < value_string.length; i++){
    result = result.concat("3" + value_string.charAt(i))
  }

  return result
}

async function start() {
  try {
      if(MAINNET){
        console.log("MAINNET");
      } else {
        console.log("TESTNET");
      }
      let _nonce = await provider.getNonce(contract_address)
      console.log("nonce:", _nonce)
      if(CHECK_APPROVE) {
        console.log("token approve:")
        for(let i = 1; i <= item_count; i++){
          const hex = getHex(i)
          try{
            const checkApprove = await nft.functions.get_approved({
              token_id:hex
            })            
            console.log(hex, checkApprove.result.value)
          } catch(e){
            console.log(hex, 'n.d.')
            const checkOwner = await nft.functions.owner_of({
              token_id:hex
            }) 
            if(checkOwner.result.value == contract_address){
              try{
                const { transaction } = await nft.functions.approve({
                  approver_address:contract_address,
                  to:contract_market,
                  token_id:hex
                }, {
                    rcLimit: 42591579,
                    sendTransaction: true
                });

                const { blockNumber } = await transaction.wait();
                if(blockNumber > 0) {
                  console.log("mined at block:", blockNumber)
                }
              } catch(e){
                console.log(e)
                i = i-1
              }
            } else {
              console.log("\t\t\t\towner:", checkOwner.result.value)
            }
          }
        }
      }

      if(SET_SALE) {
        console.log("create sales:")
        for(let i = 1; i <= item_count; i++){
          const hex = getHex(i)
          console.log(hex)
          const checkOwner = await nft.functions.owner_of({
            token_id:hex
          }) 
          if(checkOwner.result.value == contract_address){
            const getOrder = await market.functions.get_order({
              collection: contract_address,
              tokenId:hex
            }) 
            if (getOrder.result === undefined) {
              try{
                const { transaction, receipt } = await market.functions.create_order({
                  collection: contract_address,
                  tokenSell: koin,
                  tokenId: hex,
                  tokenPrice: "50000000000",
                  timeExpire: "1693145159000"
                }, {
                  rcLimit: 125915790,
                  sendTransaction: true
                });
                const { blockNumber } = await transaction.wait();
                if(blockNumber > 0) {
                  console.log("mined at block:", blockNumber)
                }
              } catch(e){
                console.log(e)
                i = i-1
              }       
            }   
          }
        }
      }

      if(CANCEL_ORDER) {
        console.log("cancel orders:")
        for(let i = 1; i <= item_count; i++){
          const hex = getHex(i)
          console.log(hex)
          const checkOwner = await nft.functions.owner_of({
            token_id:hex
          }) 
          if(checkOwner.result.value == contract_address){
            const getOrder = await market.functions.get_order({
              collection: contract_address,
              tokenId:hex
            }) 
            if (getOrder.result !== undefined) {
              try{
                const { transaction, receipt } = await market.functions.cancel_order({
                  collection: contract_address,
                  tokenId:hex
                }, {
                  rcLimit: 225915790,
                    sendTransaction: true
                });

                const { blockNumber } = await transaction.wait();
                if(blockNumber > 0) {
                  console.log("mined at block:", blockNumber)
                }    
              }catch(e){
                console.log(e)
                i = i-1
              }   
            }   
          }
        }
      }

      if(SET_ROYALITIES){
        console.log("set royalities")
        try {
          await nft.functions.set_royalties({
            value: config.royalties,
            rcLimit: "34160036"            
          })
          console.log("done")
        } catch (error) {
          console.log(error)
        }
      }
    console.log("programme end")
  } catch (error) {
    console.log(error)
  }
}

start()


