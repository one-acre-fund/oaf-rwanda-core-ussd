
var registrationEndpoint = "/Api/Registrations/RegisterClient";

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

var authHeader = "Token " + getAPIKey();

// responds with 201 code on success

module.exports = function(){

}