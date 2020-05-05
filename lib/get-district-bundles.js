/* Module to load district bundles into telerivet datatables */
var districtBundlesEndpoint = "/Api/DistrictBundles/Get/?districtId=";
function fetchDistrictBundles(districtId) {
    var fullUrl = project.vars.server_name + districtBundlesEndpoint + districtId;
    var opts ={ headers:{}};
    opts.headers['Authorization'] = "Token " + project.vars.roster_api_key;
    opts.method = "GET";
    
    try {
        var response = httpClient.request(fullUrl,opts);        
        if(response.status == 200){
            const data = JSON.parse(response.content);
            console.log('***************SUCCESS*******************');
            // console.log('****response bundles****'+data.bundles);
            // console.log('****response bundleInputs****'+data.bundleInputs);
            
            return data;
        }
        else{
            console.log("####Failed to fetch district bundles"+ JSON.stringify(response));
        }        
    } catch (error) {
        console.log('Error: '+ error)
    }
}

function processBundles(districtBundles, districtId){
    var processedBundles=[];
    // console.log( '####districtBundles###'+JSON.stringify(districtBundles));
    // console.log( '####districtBundles.bundleInputs###'+JSON.stringify(districtBundles.bundleInputs));
    console.log("#########district ID"+ districtId)
    console.log('########inputs.length: '+ districtBundles.bundleInputs.length);

    districtBundles.bundleInputs.forEach(function(bundleInput) {
        var bundle;
        districtBundles.bundles.forEach(function(b) {
            if(b.BundleId == bundleInput.BundleId){
                bundle = b;
            }
        })
    
        // for ( j = 0; j < districtBundles.bundles.length; j++) {
        //     if (districtBundles.bundles[j].BundleId == bi.BundleId){
        //         var bundle = districtBundles.bundles[j];
        //         break;
        //     }            
        // }
        
        if(bundle){
            console.log('#### found bundle: '+bundle.BundleId);
            
            const pb = {
                en: bundleInput.InputName,
                increment: bundle.BundleQuantityIncrement,
                input_name: bundleInput.InputName,
                ki: bundleInput.InputName,
                max: bundle.UpperBoundQuantity,
                min: '',
                option_number: '',
                price_per_bundle: bundle.BundleCost_PerBundle,
                fixed_price: bundle.BundleCost_Fixed,
                unit: bundleInput.UnitTypeId,
                bundleInputId: bundleInput.BundleInputId,
                bundleId: bundleInput.BundleId,
            };
            pb[bundle.DistrictId] = 1;
            processedBundles.push(pb);
        }else{
            console.log("#### No Bundle for bi"+bundleInput.BundleInputId);            
        }
    });
    
    // resetDistrictInputs(districtId);

    addProcessedBundlesToDistrict(processedBundles,districtId)

}

function addProcessedBundlesToDistrict(processedBundles,districtId){
    var table = project.getOrCreateDataTable(project.vars.input21ATable);
    processedBundles.forEach(function (pb) {
        var cursor = table.queryRows({'vars' : {'bundleInputId' : pb.bundleInputId}});
       
        if(cursor.hasNext()){
            var row = cursor.next();
            row.vars = {
                "en":pb.en,
                "increment":pb.increment,
                "input_name":pb.input_name,
                "ki":pb.ki,
                "max":pb.max,
                "min":pb.min,
                "option_number":pb.option_number,
                "price_per_bundle":pb.price_per_bundle,
                "fixed_price":pb.fixed_price,
                "unit":pb.unit,
                "bundleInputId":pb.bundleInputId,
                "bundleId":pb.bundleId
            };
            row.save();
        }
        else{
            var row = table.createRow({'vars' :  {
                "en":pb.en,
                "increment":pb.increment,
                "input_name":pb.input_name,
                "ki":pb.ki,
                "max":pb.max,
                "min":pb.min,
                "option_number":pb.option_number,
                "price_per_bundle":pb.price_per_bundle,
                "fixed_price":pb.fixed_price,
                "unit":pb.unit,
                "bundleInputId":pb.bundleInputId,
                "bundleId":pb.bundleId
            } });
            row.save();
        }
    })

}

function districtBundlesExist(districtId) {
    var table = project.getOrCreateDataTable(project.vars.input21ATable);
    var query = {}
    query[districtId] = 1;
    var cursor = table.queryRows({'vars' : query});
    return cursor.hasNext();
}
function districtBundlesAreExpired(districtId){
    var table =getOrCreateDataTable(project.vars.input21ATable);
    var query = {}
    query[districtId] = 1;
    var cursor = table.queryRows({'vars' : query});
    var row = cursor.next();
    const nowUnixTimeStamp = new Date().getTime() / 1000;
    const fiveMinutesInSeconds = 5*60;
    return row.time_updated +fiveMinutesInSeconds < nowUnixTimeStamp;    
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
    
    // console.log('****districtBundles bundles****' +districtBundles.bundles);
    // console.log('****districtBundles bundleInputs****'+districtBundles.bundleInputs);
    processBundles(districtBundles, districtId);

    
}

// var exampleResponseData ={
//     "bundles": [
//         {
//             "EntityType": "Bundle",
//             "DistrictId": 1404,
//             "BundleId": 23,
//             "BundleName": "None",
//             "BundleDescription": null,
//             "BundleQuantityIncrement": 0.250,
//             "BundleCost_Fixed": 0.00,
//             "BundleCost_PerBundle": 0.00,
//             "BundleUnitTypeId": 0,
//             "BundleTypeId": 0,
//             "BundleTypeName": "Unassigned",
//             "AcceptableQuantityList": "",
//             "UpperBoundQuantity": 100000,
//             "ConfigName": "None (2008LR) BGM",
//             "CreditOptionId": 0,
//             "CRUDLocationTypeId": 0,
//             "CRUDLocationChangeDate": "2000-01-01T00:00:00"
//         }
//     ],
//     "bundleInputs": [
//         {
//             "EntityType": "BundleInput",
//             "DistrictId": 1404,
//             "BundleInputId": 72,
//             "BundleId": 23,
//             "InputId": 40200,
//             "SelectionGroup": "None",
//             "UnitTypeId": "kg",
//             "CostAdjustment_Fixed": 0.0000,
//             "CostAdjustment_PerBundle": 0.0000,
//             "NumberOfUnits_Fixed": 0.000,
//             "NumberOfUnits_PerBundle": 0.000,
//             "KgPerUnit": 1.000,
//             "RequiredBundleInputID": null,
//             "RequiredBundleQuantityFrom": null,
//             "RequiredBundleQuantityTo": null,
//             "InputName": "None"
//         },
//         {
//             "EntityType": "BundleInput",
//             "DistrictId": 1404,
//             "BundleInputId": 113,
//             "BundleId": 23,
//             "InputId": 40066,
//             "SelectionGroup": "fertilizer",
//             "UnitTypeId": "kg",
//             "CostAdjustment_Fixed": 0.0000,
//             "CostAdjustment_PerBundle": 0.0000,
//             "NumberOfUnits_Fixed": 0.000,
//             "NumberOfUnits_PerBundle": 50.000,
//             "KgPerUnit": 1.000,
//             "RequiredBundleInputID": null,
//             "RequiredBundleQuantityFrom": null,
//             "RequiredBundleQuantityTo": null,
//             "InputName": "DAP"
//         }
//     ],
//     "inputs": [
//         {
//             "EntityType": "Input",
//             "InputId": 40066,
//             "InputName": "DAP",
//             "InputType": "Fertilizer",
//             "InputCategory": "Fertilizer",
//             "InputNotes": null,
//             "Active": true,
//             "Warranty": false,
//             "Deliverable": true,
//             "GlobalInputId": 2
//         },
//         {
//             "EntityType": "Input",
//             "InputId": 40200,
//             "InputName": "None",
//             "InputType": "None",
//             "InputCategory": "None",
//             "InputNotes": null,
//             "Active": true,
//             "Warranty": false,
//             "Deliverable": false,
//             "GlobalInputId": 1
//         }
//     ]
// }

// var exampleDataTableEntry =
// {
//     en :'',
//     increment :bundle.BundleQuantityIncrement,
//     input_name:input.name || bundleInput.name,
//     ki:'',
//     max : bundle.UpperBoundQuantity,
//     min:'',
//     option_number:'',
//     //price:'',
//     price_per_bundle:bundle.BundleCost_PerBundle,
//     fixed_price:bundle.BundleCost_Fixed,
//     unit:bundle.UnitTypeId || bundleInput.UnitTypeId ,
//     bundleInputId: bundleInput.bundleInputId,
//     bundleId: bundleInput.bundleId,
//     [districtId]: 0 || 1,
//     Time_Created:'',
//     Last_Updated:'', 
// }