/*
function for populating a USSD menu
takes as input a table + a lang
tables accessed by this function should have a field for each lang, plus an 'option_number' and 'option_name' field
option number is the numbered option that will apear in the menu
option name is the name of the response handler that will handle the selected option
*/
var msgs = require('./msg-retrieve'); 
var admin_alert = require('./admin-alert');

module.exports = function(table_name, lang, max_chars){
        
    var lang = lang || project.vars.lang;
    var console_lang = project.vars.console_lang;
    var prev_page = msgs('prev_page',{},lang);
    var next_page = msgs('next_page',{},lang);
    console.log(prev_page+"****************"+ next_page);
    
    if(prev_page == null || next_page == null){
        var lang = 'ki';
        var console_lang = 'en';
        console.log('error');
        admin_alert('Language not found\nError: ');

    } 
    max_chars = max_chars || 120;
    var output = '';
    var console_output = '';
    var menu_table = project.getOrCreateDataTable(String(table_name));
    var option_numbers = menu_table.countRowsByValue('option_number');
    var out_obj = {};
    var loc = 0;
    for(var x = 1; x <= Object.keys(option_numbers).length; x++){
        try{
            var opt_row = menu_table.queryRows({'vars' : {'option_number' : x}}).next();
            var temp_out = output + String(x) + ")" + opt_row.vars[lang] + '\n';
            if(temp_out.length < max_chars){
                output = output + String(x) + ")" + opt_row.vars[lang] + '\n';
            }
            else{
                out_obj[loc] = output + next_page;
                output = prev_page + '\n' + String(x) + ")" + opt_row.vars[lang] + '\n'
                loc = loc + 1;
            }
            console_output = console_output + String(x) + ")" + opt_row.vars[console_lang] + '\n';
        }
        catch(error){
            admin_alert('Options table length does not match option labeling\nError: ' + error+'\ntable : ' + table_name);
            break;
        }
    }

    // Append menu of accessing the market if group leaders
    if(state.vars.group_leader == 'yes'){
        state.vars.market_access_option_num = Object.keys(option_numbers).length +1;
        if(lang == 'ki'){var optn = ' Gusaba isoko'}
        else{var optn = 'Market access'}
        output = output + String(state.vars.market_access_option_num) + ") "+ optn +"\n";
    
    }
    if(Object.keys(out_obj).length > 0){
        out_obj[loc] = out_obj[loc] = output;
        return out_obj;
    }
    else{
        return output;
    }
}
