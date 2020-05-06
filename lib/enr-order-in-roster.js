module.exports = function (account_number,  client_id, an_pool) {
    console.log("####inputs:");
    var districtId, siteId, groupId;

    var tableA = project.getOrCreateDataTable(an_pool);
    var cursor = tableA.queryRows({vars:{'account_number':state.vars.account_number}});
    if(cursor.hasNext()){
        var row = cursor.next();
        districtId = row.vars.glus.split('-')[0];
        siteId = row.vars.glus.split('-')[1];
        groupId = row.vars.glus.split('-')[2];
    }else{
        console.log('Not finalised, account number not in client data table');        
        sayText(msgs('enr_not_finalized', {}, lang));
    }

    var requestData = {
        accountNumber: account_number,
        districtId: districtId,
        siteId: siteId,
        groupId: groupId,
        clientId: client_id,
        clientBundles: []
    }

    var table = project.getOrCreateDataTable('client_enrollment_data');
    var cursor = table.queryRows({ vars: { 'accountNumber': account_number } })
    var bundleInputs = {};
    while (cursor.hasNext()) {
        row = cursor.next();
        console.log('####row: ' + JSON.stringify(row.vars));

        if (bundleInputs[row.vars.bundleId]) {
            bundleInputs[row.vars.bundleId].bundleId = row.vars.bundleId;
            bundleInputs[row.vars.bundleId].bundleQuantity = row.vars.quantity;
            if (bundleInputs[row.vars.bundleId].inputChoices) {
                bundleInputs[row.vars.bundleId].inputChoices.push(row.vars.bundleInputId);
            } else {
                bundleInputs[row.vars.bundleId].inputChoices = [row.vars.bundleInputId];
            }
        } else {
            bundleInputs[row.vars.bundleId] = {
                bundleId: row.vars.bundleId,
                bundleQuantity: row.vars.quantity,
                inputChoices: [row.vars.bundleInputId]
            }
        }

    }
    Object.keys(bundleInputs).forEach(function (key) {
        requestData.clientBundles.push(bundleInputs[key]);
    });
    console.log('####bundleInputs: ' + JSON.stringify(bundleInputs));

    console.log('####requestData: ' + JSON.stringify(requestData));

    return send_request(requestData);

}

function send_request(requestData) {
    var response;
    var enrollmentEndpoint = '/api/USSDEnrollment/Enrollment/'
    var fullUrl = project.vars.server_name + enrollmentEndpoint;
    console.log("####FULL-URL: " + fullUrl);
    var opts = { headers: {} };
    opts.headers['Authorization'] = "Token " + project.vars.roster_api_key;
    opts.method = "POST";
    opts.data = requestData;
    console.log('####### requestData:' + requestData);
    console.log("#### OPtions: " + JSON.stringify(opts));

    try {
        response = httpClient.request(fullUrl, opts);
        if (response.status == 201) {
            console.log('***************ENR_SUCCESS*******************' + JSON.stringify(response));
            return true
        }else{
            console.log("#### ENR_Failed to save" + JSON.stringify(response));
        }
    } catch (e) {
        console.log('Error' + e);
        return false
    }    
    return false

}

var exampleRequestData = {
    "districtId": 1404,
    "siteId": 14,
    "groupId": 14,
    "accountNumber": "27509759",
    "clientId": -1014000371,
    "isGroupLeader": true,
    "clientBundles": [
        {
            "bundleId": -2471,
            "bundleQuantity": 1.0,
            "inputChoices": [-10865, -10864, -10863, -10862, -10861, -10846]
        },
        {
            "bundleId": -2416,
            "bundleQuantity": 1.0,
            "inputChoices": [-10733, -10732, -10731, -10730, -10729, -10728]
        }
    ]
}