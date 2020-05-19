/*
main file for external advertising ussd function
uses lib from core to execute some functions
live!!!
standard - all input handlers should include 99 as an exit option (even if not included in the options shown)
all input handlers should save any current display options and current steps to repeat if invalid input
*/

var msgs = require('./lib/msg-retrieve'); //global message handler
var geo_select = require('./lib/cta-geo-select');
var geo_process = require('./lib/cta-geo-string-processer');
var client_log = require('./lib/cta-client-logger');
var geo_data = require('./dat/rwanda-gov-geography');

global.main = function(){
    var geo_list = geo_process(geo_data);
    state.vars.current_menu = JSON.stringify(geo_list);
    sayText(msgs('external_splash', geo_list));
    promptDigits('geo_selection_1', {'submitOnHash' : false, 'maxDigits' : 1,'timeout' : 180});
}

/*
input = province selection
shows list of districts from province
*/
addInputHandler('geo_selection_1', function(input){
    state.vars.current_step = 'geo_selection_1'
    input = parseInt(input.replace(/\D/g,''));//cleans out anything nonnumeric in the input - really, input should only be digits 1 -?
    var keys = Object.keys(geo_data);
    if(input > 0 && input <= keys.length){
        var selection = input - 1;
        state.vars.province = selection;
        state.vars.province_name = keys[selection];
        client_log(contact.phone_number, {'province' : state.vars.province_name});
        geo_data = geo_select(selection, geo_data)
        var selection_menu = geo_process(geo_data);
        state.vars.current_menu = JSON.stringify(selection_menu);
        sayText(msgs('geo_selections', selection_menu));
        promptDigits('geo_selection_2', {'submitOnHash' : false, 'maxDigits' : 1,'timeout' : 180});
    }
    else if (input == 99){ // exit
        sayText(msgs('exit'));
        stopRules();
    }
    else{ // selection not within parameters
        sayText(msgs('invalid_geo_input'));
        promptDigits('repeat_geo_input', {'submitOnHash' : false, 'maxDigits' : 1,'timeout' : 180});
    }
});

/*
input = district selection
shows list of sectors from district
*/
addInputHandler('geo_selection_2', function(input){
    state.vars.current_step = 'geo_selection_2';
    input = parseInt(input.replace(/\D/g,''));//cleans out anything nonnumeric in the input - really, input should only be digits 1 -?
    var province = parseInt(state.vars.province);
    geo_data = geo_select(province, geo_data);
    var keys = Object.keys(geo_data);
    if(input > 0 && input <= keys.length){
        var selection = input - 1;
        state.vars.district = selection;
        state.vars.district_name = keys[selection];
        client_log(contact.phone_number, {'district' : state.vars.district_name});
        geo_data = geo_select(selection, geo_data);
        var selection_menu = geo_process(geo_data);
        state.vars.current_menu = JSON.stringify(selection_menu);
        sayText(msgs('geo_selections', selection_menu));
        promptDigits('geo_selection_3', {'submitOnHash' : false, 'maxDigits' : 1,'timeout' : 180});
    }
    else if (input == 99){ // exit
        sayText(msgs('exit')); // need to add this to the list
        stopRules();
    }
    else{ // selection not within parameters
        sayText(msgs('invalid_geo_input'));
        promptDigits('repeat_geo_input', {'submitOnHash' : false, 'maxDigits' : 1,'timeout' : 180});
    }
});

/*
input = sector selection
shows list of cells from sectors
*/
addInputHandler('geo_selection_3', function(input){
    state.vars.current_step = 'geo_selection_3';
    input = parseInt(input.replace(/\D/g,''));//cleans out anything nonnumeric in the input - really, input should only be digits 1 -?
    var district = state.vars.district;
    var province = state.vars.province;
    geo_data = geo_select(district, geo_select(province, geo_data));
    var keys = Object.keys(geo_data);
    console.log('at the sector handler now');
    if(input > 0 && input <= keys.length){
        var selection = input - 1;
        geo_data = geo_select(selection, geo_data);
        state.vars.sector = selection;
        state.vars.sector_name = keys[selection];
        client_log(contact.phone_number, {'sector' : state.vars.sector_name});
        var selection_menu = geo_process(geo_data);
        state.vars.current_menu = JSON.stringify(selection_menu);
        sayText(msgs('geo_selections', selection_menu));
        promptDigits('geo_selection_4', {'submitOnHash' : false, 'maxDigits' : 1,'timeout' : 180});
    }
    else if (input == 99){ // exit
        sayText(msgs('exit')); // need to add this to the list
        stopRules();
    }
    else{ // selection not within parameters
        sayText(msgs('invalid_geo_input'));
        promptDigits('repeat_geo_input', {'submitOnHash' : false, 'maxDigits' : 1,'timeout' : 180});
    }
});

/*
input = cell selection
final step!
*/
addInputHandler('geo_selection_4', function(input){
    state.vars.current_step = 'geo_selection_4';
    input = parseInt(input.replace(/\D/g,''));//cleans out anything nonnumeric in the input - really, input should only be digits 1 -?
    var province = state.vars.province;
    var district = state.vars.district;
    var sector = state.vars.sector;
    geo_data = geo_select(sector, geo_select(district, geo_select(province, geo_data)));
    var keys = Object.keys(geo_data);
    console.log('at the cell handler now');
    if(input > 0 && input <= keys.length){
        var selection = input - 1;
        var cell_name = keys[selection];
        state.vars.cell_name = cell_name;
        client_log(contact.phone_number, {'cell' : cell_name});
        var fo_dat = geo_process(geo_select(selection, geo_data));
        var fo_phone = fo_dat["$FO_PHONE"];
        fo_dat["$CELL_NAME"] =  cell_name;
        console.log(JSON.stringify(fo_dat));
        var fo_contacted = 0;
        if(!(fo_phone == 0)){ //come back to here - if one then send we will be here soon message!
            sayText(msgs('cto_fo_information', fo_dat));
            var cta_msger = require('./lib/cta-messager');
            cta_msger(fo_dat, {'$CLIENT_PHONE' : contact.phone_number});
            fo_contacted = 1;
        }
        else{
            sayText(msgs('cto_no_fo', fo_dat))
        }
        client_log(contact.phone_number, {'fo_contacted' : fo_contacted});
        stopRules();
    }
    else if (input == 99){ // exit
        sayText(msgs('exit')); // need to add this to the list
        stopRules();
    }
    else{ // selection not within parameters
        sayText(msgs('invalid_geo_input'));
        promptDigits('repeat_geo_input', {'submitOnHash' : false, 'maxDigits' : 1,'timeout' : 180});
    }
});

/*
input handler for errors or repeated inputs
*/
addInputHandler('repeat_geo_input', function(input){
    input = parseInt(input.replace(/\D/g,''));
    if(input === 99){
        sayText('exit');
        stopRules();
    }
    else if(input === 1){
        sayText(msgs('geo_selections', JSON.parse(state.vars.current_menu)));
        promptDigits(state.vars.current_step, {'submitOnHash' : false, 'maxDigits' : 1,'timeout' : 180});
    }
    else{
        sayText('exit');
        stopRules();
    }
});
