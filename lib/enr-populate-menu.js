/*
function for populating a USSD menu
takes as input a table + a lang
tables accessed by this function should have a field for each lang, plus an 'option_number' and 'option_name' field
option number is the numbered option that will apear in the menu
option name is the name of the response handler that will handle the selected option
*/

module.exports = function(displayMessage, lang, max_chars){
    try{
        //var settings = project.getOrCreateDataTable('ussd_settings'); // need something along the lines of a data table att
        var lang = lang || project.vars.lang;
        var console_lang = project.vars.console_lang;
        var next_prev_tab_name = project.vars.next_page_table_name;
        var next_prev_tab = project.getOrCreateDataTable(next_prev_tab_name);
        var next_page = next_prev_tab.queryRows({'vars' : {'name' : 'next_page'}}).next().vars[lang];
        var prev_page = next_prev_tab.queryRows({'vars' : {'name' : 'prev_page'}}).next().vars[lang];
    }
    catch(error){
        var lang = 'en';
        var console_lang = 'en';
        admin_alert = require('./admin-alert');
        admin_alert('Options table incomplete\nError: ' + error);
    }
    max_chars = max_chars || 120;
    var output = '';

    var out_obj = {};
    var loc = 0;
    var messageLength = displayMessage.length;

    if(messageLength > max_chars){
        for(var i = 0; i< displayMessage.length ; i++){
            output = output + displayMessage.slice( i, i = i + 120);
            out_obj[loc] = output ;
            messageLength = messageLength - 120;
            if(messageLength > 0){
                out_obj[loc] = out_obj[loc] + next_page
                output = prev_page + '\n';
                loc = loc + 1;
            }  
            console.log('------------------------At loc '+ loc + out_obj[loc]);
        }

        return out_obj;
    }
    else{
        return displayMessage;
    }
}
