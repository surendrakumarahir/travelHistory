const invoke = require('./fabricController.js');


let a = {
    "isDeleted": false,
    "status": "created",
    "fromCity": "Las Vegas",
    "toCity": "Ayodhya",
    "airline": "Air Arabia",
    "flightNo": "G9",
    "departureDate": "2020-08-12T00:00:00.000Z",
    "arrivalDate": "2020-08-12T00:00:00.000Z",
    "eTicket": {
        "hash": "QmVzUK3YTJ7iUDxM6fKn7nNcfXNaXP1AFhby5WgdCLmvw3",
        "ext": ".jpg",
        "fileName": "1597237123266.jpg"
    },
    "healthCertificate": {
        "hash": "QmagNhTzx3Dj7cPKRnPQ4D8SbiWpYesBQLJq7XH8JzQpTD",
        "ext": ".png",
        "fileName": "1590933281398.png"
    },
    "passportStamp": {
        "hash": "QmagNhTzx3Dj7cPKRnPQ4D8SbiWpYesBQLJq7XH8JzQpTD",
        "ext": ".png",
        "fileName": "1590933281398.png"
    },
    "entryPort": "",
    "exitPort": "",
    "travelMode": "Air",
    "userId": "5efc44e69e162e5d788cf41f",
    "createdAt": "2020-08-12T12:59:23.637Z",
    "updatedAt": "2020-08-12T12:59:23.637Z",
    "passportNo": "123345",
    "travelId": "dbjhasbdjhdb"
}

let updateRecord = { travelId: "10f09eafd9964cfb13acc58417fe545e464095b70a0a9f799dd161ad32e9fc70", status: "approveddd", comment: "hello world!" }
//let b = {"userId" : "5efc44e69e162e5d788cf41f"};
let b = { "passportNo": "123345" };
let travelId = { travelId: "10f09eafd9964cfb13acc58417fe545e464095b70a0a9f799dd161ad32e9fc70" };

async function callChaincode() {
    //let response = await invoke.callChaincode('createTravelRecord', a);
    //let response = await invoke.callChaincode('updateTravelRecord', updateRecord);
    //let response = await invoke.callChaincode('readTravelRecord', travelId);
    let response = await invoke.callChaincode('readTravelRecord', b, true);
    console.info("RESPONSE IS:::", response);
}

callChaincode();
