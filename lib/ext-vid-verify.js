/*
    Script: ext-vid-verify.js
    Description: returns true if the input village ID is in the table of village ids
    Status: complete
*/
module.exports = function(vid){
    // save number of demographic questions
    var demo_table = project.getOrCreateDataTable('demo_table');
    var demo_cursor = demo_table.queryRows({'vars' : {  'survey_type' : state.vars.survey_type}});
    var num_demo = demo_cursor.count();

    // load the rows of village table that match the input vid
    var village_table = project.getOrCreateDataTable("VillageInfo");
    var village_cursor = village_table.queryRows({vars: {'villageid' : vid}});
    village_cursor.limit(1); // replace with checks

    // return true if the input vid is in the village table
    if(village_cursor.hasNext()){
        // differentiate test cases
        var village = village_cursor.next();
        state.vars.test = village.vars.test;
        state.vars.vid = vid;
        // store various details
        call.vars.villageid = vid;
        call.vars.survey_type = state.vars.survey_type;
        call.vars.survey_id = parseInt(Math.round(new Date().getTime() / 1000));
        if(state.vars.survey_type === 'tra'){
            village.vars.fp_pn = contact.phone_number;
        }
        else{
            village.vars.sedo_pn = contact.phone_number;
        }
        village.save();
        var valid = true;
        // if demographic questions have already been answered, bypass them using step
        if(village.vars.demo_complete){
            state.vars.step = num_demo + 1;
        }

    }
    else{
        var valid = false;
    }
    return valid;
}