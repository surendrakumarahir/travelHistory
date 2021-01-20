/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');

class travelRecords extends Contract {

    constructor() {
        super('travelRecords');
    }

    async createTravelRecord(ctx, travelRecord){
        //  This is supposed to be a private methid which can be invoked from inside chaincode only
        await ctx.stub.putState(travelId, Buffer.from(JSON.stringify(travelRecord)));
        console.info('-travel information saved, creating index');
        this.manageIndexes(ctx, travelRecord, 'create');
        console.info('- end save travelRecord');
    }
    async addTravelRecord(ctx, travelData) {
        //transaction ID is being used as travel ID
        let travelId = await ctx.stub.getTxID();
        let travelRecord = {
            travelId: travelId,
            userId: travelData.userId,
            toCity: travelData.toCity,
            comment: travelData.comment,
            fromCity: travelData.fromCity,
            airline: travelData.airline,
            flightNo: travelData.flightNo,
            departureDate: travelData.departureDate,
            arrivalDate: travelData.arrivalDate,
            eTicket: {
                hash: travelData.eTicket.hash,
                fileName: travelData.eTicket.fileName,
                ext: travelData.eTicket.ext
            },
            passportStamp: {
                hash: travelData.passportStamp.hash,
                fileName: travelData.passportStamp.fileName,
                ext: travelData.passportStamp.ext
            },
            entryPort: travelData.entryPort,
            exitPort: travelData.exitPort,
            travelMode: travelData.travelMode,
            isDeleted: travelData.isDeleted,
            status: travelData.status
        };
        this.createTravelRecord(ctx, travelRecord);
    }

    async manageIndexes(ctx, travelRecord, operation){
        //  This is supposed to be a private methid which can be invoked from inside chaincode only
        /**
         * Following keys have not been included in creating composite key:
         * - status
         * - comment
         * - isDeleted
         */
        let travelIndexName = 'travelId~travelRecord';
        let userIndexName = 'travelId~userId';
        let statusIndexName = 'status~travelId';
        let deletedIndexName = 'deleted~travelId';
        let userIndexKey = await ctx.stub.createCompositeKey(userIndexName, [
            travelRecord.travelId,
            travelRecord.userId
        ]);
        let statusIndexKey = await ctx.stub.createCompositeKey(statusIndexName, [
            travelRecord.status,
            travelRecord.travelId]);
        let deletedIndexKey = await ctx.stub.createCompositeKey(deletedIndexName, [
            travelRecord.isDeleted,
            travelRecord.travelId]);
        let travelIndexKey = await ctx.stub.createCompositeKey(travelIndexName, [
            travelRecord.toCity,
            travelRecord.fromCity,
            travelRecord.airline,
            travelRecord.flightNo,
            travelRecord.departureDate,
            travelRecord.arrivalDate,
            travelRecord.entryPort,
            travelRecord.exitPort,
            travelRecord.travelMode]);
        console.info(travelIndexKey);
        console.info(statusIndexKey);
        console.info(userIndexKey);
        console.info(deletedIndexKey);
        if(operation === 'create'){
            //  Save index entry to state. Only the key name is needed,
            //  no need to store a duplicate copy of the entire travel record.
            await ctx.stub.putState(travelIndexKey, travelRecord.userId);
            await ctx.stub.putState(statusIndexKey, travelRecord.userId);
            await ctx.stub.putState(deletedIndexKey, travelRecord.userId);
            await ctx.stub.putState(userIndexKey, Buffer.from('\u0000'));
        }
        else if(operation === 'delete'){
            //  Save index entry to state. Only the key name is needed,
            //  no need to store a duplicate copy of the entire travel record.
            await ctx.stub.deleteState(travelIndexKey);
            await ctx.stub.deleteState(statusIndexKey);
            await ctx.stub.deleteState(deletedIndexKey);
            await ctx.stub.deleteState(userIndexKey);
        }
    }
    // ============================================================
    // readTravelRecord - read a travel record from chaincode state
    // ============================================================
    async readTravelRecord(ctx, travelId) {
        if (!travelId) {
            throw new Error('Travel ID must not be empty');
        }
        let travelRecordAsbytes = await ctx.stub.getState(travelId); //get the travelRecord from chaincode state
        if (!travelRecordAsbytes.toString()) {
            let jsonResp = {};
            jsonResp.Error = 'Travel Record does not exist: ' + travelId;
            throw new Error(JSON.stringify(jsonResp));
        }
        let travelData = JSON.parse(travelRecordAsbytes.toString());
        console.info('=======================================');
        console.log(travelData);
        console.info('=======================================');
        return JSON.stringify(travelData);
    }

    // ============================================================
    // Approve or reject a travel record
    // ============================================================
    async updateTravelStatus(ctx, travelId, newStatus, comment) {
        let travelRecord = await this.readTravelRecord(ctx, travelId);
        this.deleteTravelRecord(ctx, travelRecord);
        travelRecord.comment = comment;
        travelRecord.status = newStatus;
        this.createTravelRecord(ctx, travelRecord);
    }

    async deleteTravelRecord(ctx, travelRecord){
        //  This is supposed to be a private methid which can be invoked from inside chaincode only
        if (!travelRecord.travelId) {
            throw new Error('TravelId should not be empty');
        }
        await ctx.stub.deleteState(travelRecord.travelId);
        this.manageIndexes(ctx, travelRecord, 'delete');
    }
}

module.exports = travelRecords;