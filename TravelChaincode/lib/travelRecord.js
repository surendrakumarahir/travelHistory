// Smart Contract for TravelReords 

'use strict';

const { Contract } = require('fabric-contract-api');
const _ = require('lodash');

class TravelRecord extends Contract {

    // ===================================================================
    // initTravelRecord - init a travel record chaincode
    // ===================================================================
    async initTravelRecord(ctx){
        console.info('============= START : initTravelRecord ===========');
        console.info('============= END : initTravelRecord ===========');
    }

    // ===================================================================
    // createTravelRecord - create a travel record based on travel mode
    // ===================================================================
    async createTravelRecord(ctx, req){
        console.info('============= START : createTravelRecord ===========');

        let input = JSON.parse(req);
        console.info('Input : ', input);

        let travelId = ctx.stub.getTxID();
        let travelRecord = {};

        travelRecord.travelId = travelId;
        travelRecord.userId = input.userId;
        travelRecord.passportNo = input.passportNo;

        travelRecord.fromCity = input.fromCity;
        travelRecord.toCity = input.toCity;
	travelRecord.healthCertificate = input.healthCertificate;
	travelRecord.passportStamp = input.passportStamp;
        travelRecord.departureDate = input.departureDate;
        travelRecord.arrivalDate = input.arrivalDate;
        travelRecord.comment = input.comment;
        travelRecord.isDeleted = input.isDeleted;
        if (!input.createdAt) {
                console.info("created at not present !");
                throw new Error(`Created at not present`);
        }
        
        travelRecord.createdAt = input.createdAt;
        travelRecord.updatedAt = input.updatedAt;
        travelRecord.passportIssueDate = input.passportIssueDate;
        travelRecord.passportExpiryDate = input.passportExpiryDate;
        travelRecord.email = input.email;
        travelRecord.name = input.name;
        travelRecord.status = _.upperCase(input.status);

        let travelMode = _.capitalize(input.travelMode);
        travelRecord.travelMode = travelMode;
        // let travelMode = input.travelMode;
        switch(travelMode){
            case "Sea":
            case "Land":
                travelRecord.entryPort = input.entryPort;
                travelRecord.exitPort = input.exitPort;
                break;
            case "Air":
                travelRecord.airline = input.airline;
                travelRecord.flightNo = input.flightNo;
                travelRecord.eTicket = input.eTicket;
                break;
            default:
                console.info("Travel Mode: ", travelMode, " not supported !");
                throw new Error(`${travelMode} travel mode not supported`);
        }

        console.info('final travel record', travelRecord);
        await ctx.stub.putState(travelId, Buffer.from(JSON.stringify(travelRecord)));
        console.info('============= END : createTravelRecord ===========');
        return travelRecord; 
    }

    // ===================================================================
    // updateTravelRecord - update a travel record based on the travel id
    // ===================================================================
    async updateTravelRecord(ctx, req){
        console.info('============= START : updateTravelRecord ===========');

        let input = JSON.parse(req);
        console.info('Input : ', input);

        const travelId = input.travelId;
        let travelRecordAsBytes = await ctx.stub.getState(travelId);
        if (!travelRecordAsBytes || travelRecordAsBytes.length === 0) {
            throw new Error(`${travelId} does not exist`);
        }
        let travelRecord = JSON.parse(travelRecordAsBytes.toString());
        let status = _.upperCase(input.status);
        if (!((status == "APPROVED") || (status == "REJECTED"))){
            throw new Error(`${status} is not a valid status`);
        }
        travelRecord.status = status;
        if (input.comment) {
            travelRecord.comment = input.comment;
        }
        
        travelRecord.updatedAt = input.updatedAt;
        console.info('final travel record', travelRecord);
        await ctx.stub.putState(travelId, Buffer.from(JSON.stringify(travelRecord)));
        console.info('============= END : updateTravelRecord ===========');
        return travelRecord;
    }

    // ===================================================================
    // readTravelRecord - read a travel record based on the travel information
    // ===================================================================
    async readTravelRecord(ctx, req){
        console.info('============= START : readTravelRecord ===========');

        let input = JSON.parse(req);
        console.info('Input : ', input);

        let query = {};
        if (input.startDateRange || input.endDateRange){
            let createQuery = {};
            if (input.CreatedAt) {
                createQuery["$eq"]=input.createdAt;
            }
            if (input.startDateRange) {
                createQuery["$gte"] = input.startDateRange;
            }
            if (input.endDateRange){
                createQuery["$lte"] = input.endDateRange;
            }
            input.createdAt = createQuery;
            input =  _.omit(input,["startDateRange", "endDateRange"])
        } 
        query.selector = input;
        query.sort = [
            {
                createdAt: "desc"
            }
        ];
        console.info('Generated Couch query : ', query);

        let iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
        let allResults = []; 
        while (true) {
            let res = await iterator.next();
            let jsonRes = {}; 
            if (res.value && res.value.value.toString()) {
                console.log(res.value.value.toString('utf8'));
                try {
                    jsonRes = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    jsonRes = res.value.value.toString('utf8');
                }
            }
            allResults.push(jsonRes);
            if (res.done) {
                console.log('end of data');
                await iterator.close();
                console.info(allResults);
                break;
            }
        }
        console.info('============= END : readTravelRecord ===========');
        let response = {};
        response.results = allResults;
        return response;			
    }
}

module.exports = TravelRecord;
