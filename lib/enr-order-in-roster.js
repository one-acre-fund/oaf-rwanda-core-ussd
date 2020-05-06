module.exports = function (account_number,districtId,siteId,groupId,client_id) {
    console.log("####inputs:");
    
    var requestData ={
        accountNumber:account_number,
        districtId : districtId,
	    siteId:siteId,
	    groupId:groupId,
        clientId: client_id,
        clientBundles:[]
    }

    var table = project.getOrCreateDataTable('client_enrollment_data');
    var cursor = table.queryRows({vars:{'accountNumber' : account_number}})
    var bundleInputs ={ };
    while(cursor.hasNext()){
        row = cursor.next();
        console.log('####row: ' +JSON.stringify(row.vars));

        if(bundleInputs[row.vars.bundleId] ){
            bundleInputs[row.vars.bundleId].bundleId = row.vars.bundleId;
            bundleInputs[row.vars.bundleId].quantity = row.vars.quantity;
            if(bundleInputs[row.vars.bundleId].inputChoices){
                bundleInputs[row.vars.bundleId].inputChoices.push(row.vars.bundleInputId);
            }else{
                bundleInputs[row.vars.bundleId].inputChoices =[row.vars.bundleInputId];
            }
        }else{
            bundleInputs[row.vars.bundleId] ={
                    bundleId: row.vars.bundleId,
                    quantity: row.vars.quantity,
                    inputChoices: [row.vars.bundleInputId]
            }
        }

    }
    Object.keys(bundleInputs).forEach(function (key) {
        requestData.clientBundles.push(bundleInputs[key]);
    });
    console.log('####bundleInputs: ' +JSON.stringify(bundleInputs));

    console.log('####requestData: ' +JSON.stringify(requestData));
    
}

var exampleRequestData = {
	"districtId" : 1404,
	"siteId":14,
	"groupId":14,
    "accountNumber": "27509759",
    "clientId": -1014000371,
	"isGroupLeader":true,
	"clientBundles":[
		{
			"bundleId": -2471,
			"bundleQuantity":1.0,
			"inputChoices":[-10865,-10864,-10863,-10862,-10861,-10846]
		},
		{
			"bundleId": -2416,
			"bundleQuantity":1.0,
			"inputChoices":[-10733,-10732,-10731,-10730,-10729,-10728]
		}
	]
}