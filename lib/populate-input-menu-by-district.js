/*
function for populating a USSD menu
takes as input a table + a lang
tables accessed by this function should have a field for each lang, plus an 'option_number' and 'option_name' field
option number is the numbered option that will apear in the menu
option name is the name of the response handler that will handle the selected option
*/
const bundles = require('../dat/district-bundles');

const next_page_translations ={
    en:'77)Next page',
    ki: '77)Gukomeza'
}
const prev_page_translations ={
    en: '44)Previous page',
    ki: '44)Gusubira inyuma'
}
function countOptions(){
    const count ={}
    districtBundles.forEach(function(bundle){
        count[bundle.option_number] = 1 + (count[bundle.option_number] || 0)
    })
    return count
}

module.exports = function( lang, max_chars){
    var table_name = service.vars.input21ATable;
    try{
        var lang = lang || project.vars.lang;
        var console_lang = project.vars.console_lang;
        var next_page = next_page_translations[lang];
        var prev_page = prev_page_translations[lang];
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
    var option_numbers = countOptions();

    var out_obj = {};
    var loc = 0;
    for(var x = 1; x <= Object.keys(option_numbers).length; x++){
        try{
            var row = bundles.filter(function (r) { return r.option_number === x; })[0]

            if(row["d"+state.vars.client_districtId] == 1){
                var temp_out = output + row['option_number']+ ")" + row[lang] + '\n';
                if(temp_out.length < max_chars){
                    output = output + row['option_number']+ ")" + row[lang] + '\n';
                }
                else{
                    out_obj[loc] = output + next_page;
                    output = prev_page + '\n' + row['option_number'] + ")" + row[lang] + '\n'
                    loc = loc + 1;
                }
                console_output = console_output + row['option_number'] + ")" + row[console_lang] + '\n';
            }
        }
        catch(error){
            admin_alert = require('./admin-alert');
            admin_alert('Options table length does not match option labeling\nError: ' + error+'\ntable : ' + table_name);
            break;
        }
    }
    
    if(Object.keys(out_obj).length > 0){
        out_obj[loc] = out_obj[loc] = output;
        return out_obj;
    }
    else{
        return output;
    }
}
