/*
    Script: ext-sedo-verify.js
    Description: returns true if the input sedo ID is in the village table.
    Status: complete
*/

module.exports = function(input){
    // load entries in the village table that match the entere sedo ID
    var village_table = project.getOrCreateDataTable("VillageInfo");
    var sedo_cursor = village_table.queryRows({vars: {'sedo_id' : input}});
    sedo_cursor.limit(1); // replace with check

    // return true if the sedo ID appears in the village table
    if(sedo_cursor.hasNext()){
        return true;
    }
    else{
        return false;
    }
}