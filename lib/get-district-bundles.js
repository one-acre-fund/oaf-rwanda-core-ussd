/* Module to load district bundles into telerivet datatables */
var districtBundlesEndpoint = "/Api/DistrictBundles/Get/?districtId=";

function fetchDistrictBundles(districtId) {
    var fullUrl = service.vars.server_name + districtBundlesEndpoint + districtId;
    var opts = { headers: {} };
    opts.headers["Authorization"] = "Token " + service.vars.roster_api_key;
    opts.method = "GET";

    try {
        var response = httpClient.request(fullUrl, opts);
        if (response.status == 200) {
            const data = JSON.parse(response.content);
            console.log("***************SUCCESS*******************");
            // console.log("****response bundles****"+data.bundles);
            // console.log("****response bundleInputs****"+data.bundleInputs);

            return data;
        }
        else {
            const logResponse = require('./utils/request-logger');
            logResponse(fullUrl,response);
            console.log("####Failed to fetch district bundles" + JSON.stringify(response));
        }
    } catch (error) {
        console.log("Error: " + error)
    }
}
function translate_bundle_names(bundle_name, lang) {
    try {
        var bundleNameTranslationsTable = project.initDataTableById(service.vars.input21ATable_id);
        var cursor = bundleNameTranslationsTable.queryRows({ "vars": { "bundle_name": bundle_name } });
        if (cursor.hasNext()) {
            var row = cursor.next();
            if (row.vars[lang]) {
                return row.vars[lang];
            }
        }
        return bundle_name;
    } catch (error) {
        return bundle_name;
    }
}

function processBundles(districtBundles, districtId) {
    const processedBundles = [];
    districtBundles.bundles.forEach(function (bundle) {
        var bundleInput;
        districtBundles.bundleInputs.forEach(function (bi) {
            if (bi.BundleId === bundle.BundleId) {
                bundleInput = bi;
            }
        });
        if (bundleInput) {
            const processedBundle = {
                bundle_name: bundle.BundleName,
                input_name: bundleInput.InputName,
                en: translate_bundle_names(bundle.BundleName, 'en'),
                ki: translate_bundle_names(bundle.BundleName, 'ki'),
                increment: bundle.BundleQuantityIncrement,
                acceptableQuantityList: bundle.AcceptableQuantityList,
                max: bundle.UpperBoundQuantity,
                min: "",
                price: bundleInput.CostAdjustment_PerBundle,
                price_per_bundle: bundle.BundleCost_PerBundle,
                fixed_price: bundle.BundleCost_Fixed,
                unit: bundleInput.UnitTypeId,
                bundleInputId: bundleInput.BundleInputId,
                bundleId: bundleInput.BundleId,
            };
            processedBundles.push(processedBundle);
        } else {
            console.log('Empty bundle: ' + bundle.BundleName);
        }
    });
    addProcessedBundlesToDistrict(processedBundles, districtId);

}

function addProcessedBundlesToDistrict(processedBundles, districtId) {
    var table = project.initDataTableById(service.vars.input21ATable_id);
    processedBundles.forEach(function (pb) {
        var cursor = table.queryRows({ "vars": { "bundleInputId": pb.bundleInputId } });

        if (cursor.hasNext()) {
            var row = cursor.next();
            row.vars = {
                "en": pb.en,
                "ki": pb.ki,
                "increment": pb.increment,
                "input_name": pb.input_name,
                "bundle_name": pb.bundle_name,
                "acceptableQuantityList": pb.acceptableQuantityList,
                "max": pb.max,
                "min": pb.min,
                "price": pb.price,
                "price_per_bundle": pb.price_per_bundle,
                "fixed_price": pb.fixed_price,
                "unit": pb.unit,
                "bundleInputId": pb.bundleInputId,
                "bundleId": pb.bundleId
            };
            row.vars["d" + districtId] = 1;
            row.save();
        }
        else {
            var option_numbers = table.countRowsByValue('option_number');
            var nextOptionNumber = Object.keys(option_numbers).length + 1
            var row = table.createRow({
                "vars": {
                    "en": pb.en,
                    "increment": pb.increment,
                    "input_name": pb.input_name,
                    "bundle_name": pb.bundle_name,
                    "ki": pb.ki,
                    "max": pb.max,
                    "min": pb.min,
                    "acceptableQuantityList": pb.acceptableQuantityList,
                    "price": pb.price,
                    "option_number": nextOptionNumber,
                    "price_per_bundle": pb.price_per_bundle,
                    "fixed_price": pb.fixed_price,
                    "unit": pb.unit,
                    "bundleInputId": pb.bundleInputId,
                    "bundleId": pb.bundleId,
                }
            });
            row.vars["d" + districtId] = 1;
            row.save();
        }
    })

}

function districtBundlesExist(districtId) {
    var table = project.initDataTableById(service.vars.input21ATable_id);
    var query = {}
    query["d" + districtId] = 1;
    var cursor = table.queryRows({ "vars": query });
    return cursor.hasNext();
}
function districtBundlesAreExpired(districtId) {
    var table = project.initDataTableById(service.vars.input21ATable_id);
    var query = {}
    query["d" + districtId] = 1;
    var cursor = table.queryRows({ "vars": query });
    var row = cursor.next();
    const nowUnixTimeStamp = new Date().getTime() / 1000;
    const refreshPeriod = project.vars.bundlesRefreshPeriodInSeconds || 5 * 60;
    return row.time_updated + refreshPeriod < nowUnixTimeStamp;
}

module.exports = function (districtId) {
    var districtBundles;
    if (districtBundlesExist(districtId)) {
        console.log("###district bundles exist###");

        if (districtBundlesAreExpired(districtId)) {
            console.log("###district bundles are expired ###");
            try {
                districtBundles = fetchDistrictBundles(districtId);
            } catch (error) {
                console.log("###Failed to refresh bundles \n" + error);
                return;
            }
        } else {
            console.log("###district bundles are not expired ###");
            return;
        }
    } else {
        console.log("###district bundles don't exist###");
        districtBundles = fetchDistrictBundles(districtId)
    }
    // console.log("****districtBundles bundles****" +districtBundles.bundles);
    // console.log("****districtBundles bundleInputs****"+districtBundles.bundleInputs);
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
//     en :"",
//     increment :bundle.BundleQuantityIncrement,
//     input_name:input.name || bundleInput.name,
//     ki:"",
//     max : bundle.UpperBoundQuantity,
//     min:"",
//     option_number:"",
//     //price:"",
//     price_per_bundle:bundle.BundleCost_PerBundle,
//     fixed_price:bundle.BundleCost_Fixed,
//     unit:bundle.UnitTypeId || bundleInput.UnitTypeId ,
//     bundleInputId: bundleInput.bundleInputId,
//     bundleId: bundleInput.bundleId,
//     [districtId]: 0 || 1,
//     Time_Created:"",
//     Last_Updated:"", 
// }