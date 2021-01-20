'use strict';
/*
 * Trigger chaincode functions
 */

const Fabric_Client = require('fabric-client');
const fs = require('fs');
const path = require('path');
const util = require('util');

const fabricConfig = require('../config/fabric.json');
let channelName = fabricConfig.channelName;
let chaincodeName = fabricConfig.chaincodeName;

let org1tlscacert_path = path.join(__dirname,'../config','crypto-config', fabricConfig.ca.tlsPath);
let org1tlscacert = fs.readFileSync(org1tlscacert_path, 'utf8');


module.exports = {


    callChaincode: async (functionName, args, isQuery=false) => {
        try {
            console.log('Setting up client side network objects');
            const fabric_client = new Fabric_Client();

            const channel = fabric_client.newChannel(channelName);
            const peer = fabric_client.newPeer(fabricConfig.peer.peerURL, {
                'ssl-target-name-override': fabricConfig.peer.containerName,
                pem: org1tlscacert
            });
            let order = fabric_client.newOrderer(fabricConfig.ordererURL);
            channel.addOrderer(order);
            console.log('Created client side object to represent the peer');

            const store_path = path.join(__dirname, '../config','certificates');
            console.log('Setting up the user store at path:'+store_path);
            const state_store = await Fabric_Client.newDefaultKeyValueStore({ path: store_path});
            fabric_client.setStateStore(state_store);
            const crypto_suite = Fabric_Client.newCryptoSuite();
            const crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
            crypto_suite.setCryptoKeyStore(crypto_store);
            fabric_client.setCryptoSuite(crypto_suite);

            /**
             * get the enrolled user and  assign to the client instance
             * this user will sign all requests for the fabric network
             */
            const user = await fabric_client.getUserContext(fabricConfig.ca.caCredentials.userName, true);
            if (user && user.isEnrolled()) {
                console.log('Successfully loaded user from user store');
            } else {
                throw new Error('Admin not registered');
            }

            console.info('Successfully setup client side');
            console.info('Start invoke processing');

            await channel.initialize({ discover: false, asLocalhost: true, target: peer });

            const tx_id = fabric_client.newTransactionID();
            console.log("Created a transaction ID::", tx_id.getTransactionID());

            const proposal_request = {
                targets: [peer],
                chaincodeId: chaincodeName,
                fcn: functionName,
                args: [JSON.stringify(args)],
                chainId: channelName,
                txId: tx_id
            };

            const endorsement_results = await channel.sendTransactionProposal(proposal_request);

            const proposalResponses = endorsement_results[0];
            const proposal = endorsement_results[1];

            // check the results to decide if we should send the endorsment to be orderered
            if (proposalResponses[0] instanceof Error) {
                console.error('Failed to send Proposal. Received an error :: ' + proposalResponses[0].toString());
                console.log("proposalResponses", typeof(proposalResponses[0]))
                if(proposalResponses[0].toString().indexOf("travel mode not supported") != -1) {
                    return {status: "FAILED", msg: "INVALID_TRAVEL_MODE"};
                }
                else if(proposalResponses[0].toString().indexOf("does not exist") != -1) {
                    return {status: "FAILED", msg: "TRAVEL ID DOES NOT EXIST"};
                }
                else if(proposalResponses[0].toString().indexOf("not a valid status") != -1) {
                    return {status: "FAILED", msg: "INVALID STATUS"};
                }
                else return {status: "FAILED", msg: "BAD REQUEST"};

            } else if (proposalResponses[0].response && proposalResponses[0].response.status === 200) {
                console.info('Successfully sent Proposal and received status::', proposalResponses[0].response.status);
                if(isQuery) {
                    return JSON.parse(proposalResponses[0].response.payload.toString());
                }
            } else {
                const error_message = util.format('Invoke chaincode proposal:: %j', proposalResponses[i]);
                console.error(error_message);
                throw new Error(error_message);
            }

            // The proposal was good, now send to the orderer to have the transaction
            // committed.

            const commit_request = {
                proposalResponses: proposalResponses,
                proposal: proposal
            };

            const transaction_id_string = tx_id.getTransactionID();

            const promises = [];

            const sendPromise = channel.sendTransaction(commit_request);
            promises.push(sendPromise);

            let event_hub = channel.newChannelEventHub(peer);

            let txPromise = new Promise((resolve, reject) => {
                // setup a timeout of 30 seconds
                let handle = setTimeout(() => {
                    event_hub.unregisterTxEvent(transaction_id_string);
                    event_hub.disconnect();
                    resolve({event_status : 'TIMEOUT'});
                }, 30000);

                event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
                    clearTimeout(handle);
                    const return_status = {event_status : code, tx_id : transaction_id_string};
                    if (code !== 'VALID') {
                        console.error('The transaction was invalid, code = ' + code);
                        resolve(return_status); 
                    } else {
                        console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
                        resolve(return_status);
                    }
                }, (err) => {
                    reject(new Error('There was a problem with the eventhub ::'+err));
                },
                    {disconnect: true}
                );

                event_hub.connect();
                console.log('Registered transaction listener with the peer event service for transaction ID:', transaction_id_string);
            });

            promises.push(txPromise);

            console.log('Sending endorsed transaction to the orderer');
            const results = await Promise.all(promises);

            if (results[0].status === 'SUCCESS') {
                console.log('Successfully sent transaction to the orderer');
                return JSON.parse(proposalResponses[0].response.payload.toString());
            } else {
                const message = util.format('Failed to order the transaction. Error code: %s', results[0].status);
                console.error(message);
                throw new Error(message);
            }

            if (results[1] instanceof Error) {
                console.error(message);
                throw new Error(message);
            } else if (results[1].event_status === 'VALID') {
                console.log('Successfully committed the change to the ledger by the peer');
                console.log('\n\n - try running "node query.js" to see the results');
            } else {
                const message = util.format('Transaction failed to be committed to the ledger due to : %s', results[1].event_status)
                console.error(message);
                throw new Error(message);
            }
        } catch(error) {
            console.log('Unable to complete transaction ::', error.toString());
        }
    }
}
