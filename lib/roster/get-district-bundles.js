

var authHeader = "Token " + getAPIKey();

var exampleResponse = {
    "bundles": [],
    "bundleInputs": [],
    "inputs": []
}

module.exports = function( districtId){
    var registrationEndpoint = "/Api/DistrictBundles/Get/?districtId=" + districtId;

    var opts ={};
    opts.headers['Authorization'] = authHeader;
    opts.method = "GET";

    var fullUrl = this.rosterServer + registrationEndpoint;
    var response = httpClient.request(fullURL, opts);


}