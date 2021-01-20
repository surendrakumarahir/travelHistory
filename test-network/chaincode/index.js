/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const travelRecords = require('./lib/assetTransfer');

module.exports.AssetTransfer = travelRecords;
module.exports.contracts = [travelRecords];
