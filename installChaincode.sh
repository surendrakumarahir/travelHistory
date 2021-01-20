#!/bin/bash

## Global Variables
CHANNEL_NAME=$1
CHAINCODE_NAME=$2
WORK_DIR=/home/ubuntu/Travel/TravelHistory/TravelChaincode
ORDERER=orderer.travelconsulting.com:7050
PEER=peer0.org1.travelconsulting.com
CORE_PEER_ORG1_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.travelconsulting.com/users/Admin@org1.travelconsulting.com/msp


## Copy Chaincode
docker cp $WORK_DIR $PEER:/$2

# Install Chaincode peer0.org1
docker exec -e CORE_PEER_MSPCONFIGPATH=$CORE_PEER_ORG1_MSPCONFIGPATH -e CORE_PEER_ADDRESS=peer0.org1.travelconsulting.com:7051 -e CORE_PEER_LOCALMSPID="Org1MSP" -e CORE_PEER_TLS_ROOTCERT_FILE=$CORE_PEER_ORG1_TLS_ROOTCERT_FILE -it $PEER peer chaincode install -n $CHAINCODE_NAME -v 1.0 -p /$CHAINCODE_NAME -l node

sleep 2
# Instantiate Chaincode 
docker exec -e CORE_PEER_MSPCONFIGPATH=$CORE_PEER_ORG1_MSPCONFIGPATH -e CORE_PEER_ADDRESS=peer0.org1.travelconsulting.com:7051 -e CORE_PEER_LOCALMSPID="Org1MSP" -e CORE_PEER_TLS_ROOTCERT_FILE=$CORE_PEER_ORG1_TLS_ROOTCERT_FILE -it $PEER peer chaincode instantiate -o $ORDERER -n $CHAINCODE_NAME -C $CHANNEL_NAME -c '{"Args":["initTravelRecord"]}' -v 1.0
sleep 5
# Invoke Chaincode

docker exec -e CORE_PEER_MSPCONFIGPATH=$CORE_PEER_ORG1_MSPCONFIGPATH -e CORE_PEER_ADDRESS=peer0.org1.travelconsulting.com:7051 -e CORE_PEER_LOCALMSPID="Org1MSP" -e CORE_PEER_TLS_ROOTCERT_FILE=$CORE_PEER_ORG1_TLS_ROOTCERT_FILE -it $PEER peer chaincode invoke -o $ORDERER -n $CHAINCODE_NAME -C $CHANNEL_NAME  -c '{"Args":["initTravelRecord"]}' 
