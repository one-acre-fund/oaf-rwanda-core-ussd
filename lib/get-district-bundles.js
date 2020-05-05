/* Module to load district bundles into telerivet datatables */
var districtBundlesEndpoint = "Api/DistrictBundles/Get/?districtId=";
function fetchDistrictBundles(districtId) {
    var fullUrl = project.vars.server_name + districtBundlesEndpoint + districtId;
    var opts ={ headers:{}};
    opts.headers['Authorization'] = "Token " + project.vars.roster_api_key;
    opts.method = "GET";
    var response ='';
    
    try {
        response = httpClient.request(fullUrl,opts);
        if(response.status == 200){
            console.log('***************SUCCESS*******************'+JSON.stringify(response));
            return response.content;
        }        
    } catch (error) {
        console.log('Error: '+ error)
    }

    console.log("####Failed to fetch district bundles"+ JSON.stringify(response));
}

function processBundles(districtBundles, districtId){
    var processedBundles=[];

   
    districtBundles.bundleInputs.forEach(bi => {
        var bundle = districtBundles.bundles.find(b=>b.BundleId == bi.BundleId);
        const pb = {
            en: bi.name,
            increment: bundle.BundleQuantityIncrement,
            input_name: bi.name,
            ki: bi.name,
            max: bundle.UpperBoundQuantity,
            min: '',
            option_number: '',
            price_per_bundle: bundle.BundleCost_PerBundle,
            fixed_price: bundle.BundleCost_Fixed,
            unit: bi.UnitTypeId,
            bundleInputId: bi.bundleInputId,
            bundleId: bi.bundleId,
        };
        pb[bundle.DistrictId] = 1;
        processedBundles.push(pb);
    });
    
    // resetDistrictInputs(districtId);

    addProcessedBundlesToDistrict(processedBundles,districtId)

}

function addProcessedBundlesToDistrict(processBundles,districtId){
    var table = project.getOrCreateDataTable(project.vars.input21ATable);
    processedBundles.forEach(pb=>{
        var cursor = table.queryRows({'vars' : {'bundleInputId' : bundleInputId}});
       
        if(cursor.hasNext()){
            var row = cursor.next();
            row.vars = pb;
            row.save();
        }
        else{
            var row = cursor.createRow({vars : pb});
            row.save();
        }
    })
    
    var row = table.queryRows({'vars' : {'bundleInputId' : bundleInputId}});   
}

module.exports = function (districtId) {
    var districtBundles;
    if(districtBundlesExist(districtId)){
        if(districtBundlesAreExpired(districtId)){
           districtBundles =  fetchDistrictBundles(districtId);
        }else{
            return
        }
    }else{
        districtBundles =  fetchDistrictBundles(districtId)
    }
    processBundles(districtBundles);

    
}

var exampleResponseData ={
    "bundles": [
        {
            "EntityType": "Bundle",
            "DistrictId": 1404,
            "BundleId": 23,
            "BundleName": "None",
            "BundleDescription": null,
            "BundleQuantityIncrement": 0.250,
            "BundleCost_Fixed": 0.00,
            "BundleCost_PerBundle": 0.00,
            "BundleUnitTypeId": 0,
            "BundleTypeId": 0,
            "BundleTypeName": "Unassigned",
            "AcceptableQuantityList": "",
            "UpperBoundQuantity": 100000,
            "ConfigName": "None (2008LR) BGM",
            "CreditOptionId": 0,
            "CRUDLocationTypeId": 0,
            "CRUDLocationChangeDate": "2000-01-01T00:00:00"
        }
    ],
    "bundleInputs": [
        {
            "EntityType": "BundleInput",
            "DistrictId": 1404,
            "BundleInputId": 72,
            "BundleId": 23,
            "InputId": 40200,
            "SelectionGroup": "None",
            "UnitTypeId": "kg",
            "CostAdjustment_Fixed": 0.0000,
            "CostAdjustment_PerBundle": 0.0000,
            "NumberOfUnits_Fixed": 0.000,
            "NumberOfUnits_PerBundle": 0.000,
            "KgPerUnit": 1.000,
            "RequiredBundleInputID": null,
            "RequiredBundleQuantityFrom": null,
            "RequiredBundleQuantityTo": null,
            "InputName": "None"
        },
        {
            "EntityType": "BundleInput",
            "DistrictId": 1404,
            "BundleInputId": 113,
            "BundleId": 23,
            "InputId": 40066,
            "SelectionGroup": "fertilizer",
            "UnitTypeId": "kg",
            "CostAdjustment_Fixed": 0.0000,
            "CostAdjustment_PerBundle": 0.0000,
            "NumberOfUnits_Fixed": 0.000,
            "NumberOfUnits_PerBundle": 50.000,
            "KgPerUnit": 1.000,
            "RequiredBundleInputID": null,
            "RequiredBundleQuantityFrom": null,
            "RequiredBundleQuantityTo": null,
            "InputName": "DAP"
        }
    ],
    "inputs": [
        {
            "EntityType": "Input",
            "InputId": 40066,
            "InputName": "DAP",
            "InputType": "Fertilizer",
            "InputCategory": "Fertilizer",
            "InputNotes": null,
            "Active": true,
            "Warranty": false,
            "Deliverable": true,
            "GlobalInputId": 2
        },
        {
            "EntityType": "Input",
            "InputId": 40200,
            "InputName": "None",
            "InputType": "None",
            "InputCategory": "None",
            "InputNotes": null,
            "Active": true,
            "Warranty": false,
            "Deliverable": false,
            "GlobalInputId": 1
        }
    ]
}

var exampleDataTableEntry =
{
    en :'',
    increment :bundle.BundleQuantityIncrement,
    input_name:input.name || bundleInput.name,
    ki:'',
    max : bundle.UpperBoundQuantity,
    min:'',
    option_number:'',
    //price:'',
    price_per_bundle:bundle.BundleCost_PerBundle,
    fixed_price:bundle.BundleCost_Fixed,
    unit:bundle.UnitTypeId || bundleInput.UnitTypeId ,
    bundleInputId: bundleInput.bundleInputId,
    bundleId: bundleInput.bundleId,
    [districtId]: 0 || 1,
    Time_Created:'',
    Last_Updated:'', 
}