/*
    Script: ext-check-stop.js
    Description: exits the survey if user hits 9999 or has word "stop" and prevents reinitization.
    Status: in progress
*/

module.exports = function(input){
    // list of possible options
    var stop_list = new Array('9999', '99', 'stop', 'Stop', 'STOP');
    console.log('input is ' + input + ' and its type is ' + typeof(input) + ' ' + stop_list.indexOf(String(input)));

    // end survey if input is in the stop list
    if(stop_list.indexOf(String(input)) >= 0){
        call.vars.completed = 'manual stop';
        sayText('Murakoze');
        return true;
    }
    else{
        return false;
    }
}