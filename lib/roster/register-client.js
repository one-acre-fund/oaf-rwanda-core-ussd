
var registrationEndpoint = "/Api/Registrations/RegisterClient";

var exampleRequestData = {
    "districtId" : 1404,
    "siteId":14,
    "groupId":14,
    "firstName":"Angello",
    "lastName":"Obel",
    "nationalIdNumber":"{{$randomInt}}",
    "phoneNumber":"0776320345"
}

var exampleResponse ={
    "EntityType": "Client",
    "DistrictId": 1404,
    "ClientId": -1014000370,
    "FirstName": "Angello",
    "LastName": "Obel",
    "EnrollmentDate": "2020-04-29T13:29:52.36",
    "Ban": false,
    "BannedDate": null,
    "DateCreated": "2020-04-29T13:29:52.36",
    "Deceased": false,
    "DeceasedDate": null,
    "AccountNumber": "27509737",
    "GlobalClientId": "dd65a009-8bcf-475e-86b4-bc5ea5dc7939",
    "FirstSeasonId": 280,
    "LastActiveSeasonId": null,
    "NationalId": "358",
    "OldGlobalClientId": null,
    "ParentGlobalClientId": null,
    "ValidationCode": null,
    "CanEnrollAsNewMember": null,
    "SiteId": 14
}



module.exports = function(clientJSON){

        var response;
        var fullUrl = project.vars.server_name + registrationEndpoint;
        console.log("####FULL-URL: "+fullUrl);
        var opts ={ headers:{}};
        opts.headers['Authorization'] = "Token " + project.vars.roster_api_key;
        var auth = "Token " + project.vars.roster_api_key;
        opts.method = "POST";
        opts.data = clientJSON;
        console.log("#### typeof clientjson: "+ typeof clientJSON)
        console.log('####### ClientJSON:'+ clientJSON);
        console.log("#### OPtions: "+JSON.stringify(opts));

        try{
            response = httpClient.request(fullUrl,opts);
            if(response.status == 200){
                console.log('***************SUCCESS*******************'+JSON.stringify(response));
                return response.content;
            }

        }catch(e){
            console.log('Error'+e);
        }

        console.log("####Failed to save"+ JSON.stringify(response));
    
}