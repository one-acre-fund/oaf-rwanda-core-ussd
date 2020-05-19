/*
lib module for retrieving by outgoing messages by language
lang should be set in the ussd_settings table in TR
lang options now are EN, KI - can be generalized
function takes a message 'name', and return the message translation in the corresponding lang
opts should include any additions or changes to the message string - for example, inserting client credit, etc - in order of insertion
opts should be an object - the keys can be any string that can be converted to a regex, and the values will be the replacement strings.
ensure that keys are unique
requires a table in TR with a column for message name, and one column each for each implemented language
*/

module.exports = function(msg_name, opts, lang){ //todo: settings and translation tables should be generalized once this is online
    try{
        //var settings = project.getOrCreateDataTable('ussd_settings'); // can maybe move this out into another module
        var newline_regex = RegExp(project.vars.new_line, 'g');
        var msg_lang = lang || project.vars.lang;
        var console_lang = project.vars.console_lang;
    }
    catch(error){
        var newline_regex = RegExp('~B','g');
        var msg_lang = 'en';
        var console_lang = 'en';
        admin_alert = require('./admin-alert');
        admin_alert('Options table incomplete\nError: ' + error);
    }
    opts = opts || {}; //default value for opts
    var output = '';
    try{
        var messages = project.getOrCreateDataTable('message_translations'); //todo: message translation table should be generalized rather than hardcoded
        var cursor = messages.queryRows({
            vars: {
                'name' : msg_name,
            }
        });
        if(cursor.hasNext()){ //retrieve message from table
            var msg_row = cursor.next();
            var output = msg_row.vars[msg_lang].replace(newline_regex, "\n");
            var con_msg = msg_row.vars[console_lang].replace(newline_regex, "\n");
            var keys = Object.keys(opts);
            if(keys.length > 0){ //insert options
                for(i = 0; i < keys.length; i++){
                    k = keys[i];
                    output = output.replace(k, opts[k]); //output replace
                    con_msg = con_msg.replace(k, opts[k]);  //console message replace
                }
            }
            console.log(con_msg);
        }
        else{
            throw 'Message ' + msg_name + ' | ' + msg_lang + ' not found';
        }
    }
    catch(error){
        console.log('Error: ' + error);
        if(msg_lang != 'en' || msg_lang != 'ki'){ //checks for msg_lang and sets to en if en or ki not found.
            msg_lang = 'en';
        }
        var error_msg = {'en' : 'Error. Call TUBURA at 2580', 'ki' : 'TUBURA : Hamagara 2580'}
        output = error_msg[msg_lang];
    }
    finally{
        return output;
    }
}
