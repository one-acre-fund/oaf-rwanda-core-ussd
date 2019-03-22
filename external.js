/*
main file for external advertising ussd function
uses lib from core to execute some functions
so very incomplete - for testing purposes only now
*/

var msgs = require('./lib/msg-retrieve'); //global message handler
var admin_alert = require('./lib/admin-alert'); //global admin alerter
var geo_select = require('./lib/geo-select');
var geo_process = require('./lib/geo-string-processer');

global.main = function(){
    var geo_data = JSON.stringify(geo_select('Rwanda'));
    var geo_list = geo_process(geo_data);
    sayText(msgs('external_splash', {'$REGION_LIST' : geo_list}));
    promptDigits('geo_selection', { 'submitOnHash' : false,
                                 'maxDigits'    : 1,
                                 'timeout'      : 180 });
}

addInputHandler('geo_selection', function(input){ //recurses!
    input = parseInt(input.replace(/\D/g,''));//cleans out anything nonnumeric in the input - really, input should only be digits 1 -?
    var geo_data = JSON.parse(state.vars.geo_data);
    var keys = Object.keys(geo_data);
    if(input > 0 && input <= keys.length){
        var selection = keys[input - 1]
        geo_data = geo_select(selection, geo_data);
        if(typeof(geo_data) == 'string'){ //reached bottom - sends client FO phone number and send message to FO. send via USSD and via SMS
            //here finalize - send message 
        }
    }
    else if (input == 99){ // exit
        sayText(msgs('exit')); // need to add this to the list
        stopRules();
    }
    else{ // selection not within parameters
        sayText(msgs('invalid_geo_input'));
    }
});
