
/*
function for populating a USSD menu
takes as input a table + a lang
tables accessed by this function should have a field for each lang, plus an 'option_number' and 'option_name' field
option number is the numbered option that will apear in the menu
option name is the name of the response handler that will handle the selected option
*/

module.exports = function(table_name, lang, max_chars){
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
    var console_output = '';
    var menu_table = project.getOrCreateDataTable(String(table_name));
    var table = project.getOrCreateDataTable(String(table_name));
    var option_numbers = menu_table.countRowsByValue('status');
    console.log(JSON.stringify(option_numbers.Active)+"************************");
    var out_obj = {};
    var loc = 0;
    var outpuT;
    for(var x = 1; x <= option_numbers.Active; x++){
        try{
            var opt_row = table.queryRows({'vars' : {'option_number':x,'status':"Active"}}).next();
            console.log("the value:"+JSON.stringify(opt_row));
            var temp_out = output + String(opt_row.vars.option_number) + ")" + opt_row.vars.survey_type + '\n';
            if(temp_out.length < max_chars){
                output = output + String(opt_row.vars.option_number) + ")" + opt_row.vars.survey_type + '\n';
            }
            else{
                out_obj[loc] = output + next_page;
                output = prev_page + '\n' + String(opt_row.vars.option_number) + ")" + opt_row.vars.survey_type + '\n'; 
                loc = loc + 1;
            }
            console_output = console_output + String(opt_row.vars.option_number) + ")" + opt_row.vars.survey_type;
            console.log(console_output)
        }
        catch(error){
            //admin_alert = require('./admin-alert');
            //admin_alert('Options table length does not match option labeling\nError: ' + error+'\ntable : ' + table_name);
            break;
        }
    }
     if(Object.keys(out_obj).length > 0){
        out_obj[loc] = out_obj[loc] = output;
        for(var i = 0; i< Object.keys(out_obj).length;i++){
            console.log('##################'+i+' '+out_obj[i]);
        }
         return out_obj;
     }
    else{
        return output;
    }
}
