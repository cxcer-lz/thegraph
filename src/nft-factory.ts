import { BigInt,log  } from "@graphprotocol/graph-ts";
import {
  NFTCreated as NFTCreatedEvent,
  NFTRegesitered as NFTRegesiteredEvent,
  OwnershipTransferred as OwnershipTransferredEvent
} from "../generated/NFTFactory/NFTFactory"
import {
  NFTCreated,
  NFTRegesitered,
  OwnershipTransferred,
  TokenInfo
} from "../generated/schema"
import { S2NFT } from "../generated/NFTFactory/S2NFT"

export function handleNFTCreated(event: NFTCreatedEvent): void {
  let entity = new NFTCreated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  let id = event.params.nftCA.toHex();
  let tokenInfo = new TokenInfo(id);
  entity.nftCA = event.params.nftCA

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  let nftContract = S2NFT.bind(event.params.nftCA);

  // Try to get baseURI
  let baseURICall = nftContract.try__baseURI();
  if (!baseURICall.reverted) {
    tokenInfo.tokenURL = baseURICall.value;
    log.info("Base URI: {}", [baseURICall.value]);
  } else {
    tokenInfo.tokenURL = "";
    log.warning("Base URI call reverted for contract: {}", [event.params.nftCA.toHex()]);
  }

  // Try to get name
  let nameCall = nftContract.try_name();
  if (!nameCall.reverted) {
    tokenInfo.name = nameCall.value;
    log.info("NFT Name: {}", [nameCall.value]);
  } else {
    tokenInfo.name = "";
    log.warning("Name call reverted for contract: {}", [event.params.nftCA.toHex()]);
  }

  tokenInfo.ca = event.params.nftCA;
  tokenInfo.tokenId = BigInt.fromI32(0); // Initial tokenId, actual value should be set when token is created
  tokenInfo.owner = event.params.nftCA; // Set to contract address initially, update later
  tokenInfo.blockNumber = event.block.number;
  tokenInfo.blockTimestamp = event.block.timestamp;
  tokenInfo.transactionHash = event.transaction.hash;

  entity.save();
  tokenInfo.save();
}

export function handleNFTRegesitered(event: NFTRegesiteredEvent): void {
  let entity = new NFTRegesitered(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.nftCA = event.params.nftCA

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  let id = event.params.nftCA.toHex();
  let tokenInfo = TokenInfo.load(id);

  if (tokenInfo == null) {
    tokenInfo = new TokenInfo(id);
  }

  // 更新 tokenInfo 的 blockNumber 和 blockTimestamp
  tokenInfo.blockNumber = event.block.number;
  tokenInfo.blockTimestamp = event.block.timestamp;
  tokenInfo.transactionHash = event.transaction.hash;

  entity.save();
  tokenInfo.save();
}

export function handleOwnershipTransferred(
  event: OwnershipTransferredEvent
): void {
  let entity = new OwnershipTransferred(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.previousOwner = event.params.previousOwner
  entity.newOwner = event.params.newOwner

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  let id = event.params.newOwner.toHex();
  let tokenInfo = TokenInfo.load(id);
  if (tokenInfo != null) {
    tokenInfo.owner = event.params.newOwner;
    tokenInfo.save();
  }

  entity.save();
}