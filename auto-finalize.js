/*
    Script: auto-finalize.js
    Description: labels client USSD orders as finalized if they haven't been changed in a given timeframe
    Status: in progress
*/

// load necessary tables and modules
var msgs = require('./lib/msg-retrieve');
var messager = require('./lib/enr-messager');
var settings_table = project.getOrCreateDataTable('ussd_settings');
var client_table = project.getOrCreateDataTable('21a_client_data');

// save constants
const last_order = parseInt(settings_table.queryRows({'vars' : {'settings' : 'enr_last_order'}}).next().vars.value); 
const day = 24 * 60 * 60 * 1000; // milliseconds in one day, used for date subtraction
const lang = 'ki';

global.main = function(){
    // filter client table for unfinalized clients who have ordered
    var cursor = client_table.queryRows({'vars' : 
                {   'finalized'     : 0,
                    'placed_order'  : 1
                }
    });

    // update finalized to 1 and alert client
    while(cursor.hasNext()){
        var client = cursor.next();
        var current_date = new Date();
        var days_since_last_update = Math.round(Math.abs((current_date - client.vars.time_updated) / day)); 
        if(days_since_last_update > last_order){
            client.vars.finalized = 1;
            client.vars.autofinalized = 1;
            client.save();
            // send outgoing USSD message to client
            var client_phone = client_table.queryRows({'vars' : {'account_number' : client.vars.account_number}}).next().vars.pn;
            messager(client_phone, msgs('enr_autofinalize', {'$ACCOUNT' : client.vars.account_number}, lang)); 
            return;
        }
        else{
            return;
        }
    }
};