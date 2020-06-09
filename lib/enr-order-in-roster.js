
var clientEnrollmentTable = project.initDataTableById(service.vars.client_enrollment_table_id);

function parse_gid(gid) {

    var districtId = parseInt(gid.slice(0,5),10);
    var siteId, groupId;
    var group_code = gid.replace(/\W/g, '-');
    if(group_code[5] == '-'){ //siteId is negative
        siteId = parseInt(group_code.slice(5,9), 10);
        if(group_code[9] == '-'){ //groupId is negative
            groupId = parseInt(group_code.slice(9,group_code.length), 10);
        }else{
            groupId = parseInt(group_code.slice(8,group_code.length), 10);
        }
        
    }else{
        siteId = parseInt(group_code.slice(5,8), 10);
        if(group_code[9] == '-'){ //groupId is negative
            groupId = parseInt(group_code.slice(9,group_code.length), 10);
        }else{
            groupId = parseInt(group_code.slice(8,group_code.length), 10);
        }
    }

    return {
        districtId:districtId,
        siteId:siteId ,
        groupId: groupId
    }
}

function removeDuplicates(arr) {
    return arr.filter(function(value,index){
        return arr.indexOf(value) === index
    });    
}

module.exports = function (account_number,  client_id, clientTable) {
    console.log("####inputs:");
    var districtId, siteId, groupId, group_code;
    var cursor = clientTable.queryRows({vars:{'account_number':state.vars.account_number}});
    var isGroupLeader = false;
    if(cursor.hasNext()){
        var row = cursor.next();
        group_code = row.vars.glus;
        isGroupLeader = row.vars.group_leader == 1;
        var parsed_gid = parse_gid(group_code);
        districtId = parsed_gid.districtId;
        siteId = parsed_gid.siteId;
        groupId = parsed_gid.groupId;
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
        isGroupLeader: isGroupLeader,
        clientBundles: []
    }
    console.log('####Account number: ' + account_number);
    var cursor = clientEnrollmentTable.queryRows({ vars: { 'accountNumber': account_number} });
    var bundleInputs = {};

    var allRows = cursor.all().reverse();

    var noDuplicates = _.uniq(allRows,false,function(row){
        return String(row.vars.bundleId);
    })

    console.log('####Validrow: ' + JSON.stringify(allRows));
    noDuplicates.forEach(function(row){
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
        bundleInputs[row.vars.bundleId].inputChoices = removeDuplicates(bundleInputs[row.vars.bundleId].inputChoices)
    })
    Object.keys(bundleInputs).forEach(function (key) {
        requestData.clientBundles.push(bundleInputs[key]);
    });
    console.log('####bundleInputs: ' + JSON.stringify(bundleInputs));

    console.log('####requestData: ' + JSON.stringify(requestData));

    const result = send_request(requestData);
    if(result){
        allRows.forEach(function (row) {
            row.delete();
        })
    }
    return result;

}

function send_request(requestData) {
    var response;
    var enrollmentEndpoint = '/api/USSDEnrollment/Enrollment/'
    var fullUrl = service.vars.server_name + enrollmentEndpoint;
    console.log("####FULL-URL: " + fullUrl);
    var opts = { headers: {} };
    opts.headers['Authorization'] = "Token " + service.vars.roster_api_key;
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
            const logResponse = require('./utils/request-logger');
            logResponse(fullUrl,response);
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