/*
small module for verifying whether or not an input looks like a RW NID
*/

module.exports = function(input){
    var instr = String(input);
    if(instr[0] != 1 || instr.length !== 16){
        return false;
    }
    var year = parseInt(instr.slice(1,5))
    if((((2019 - year) < 15)) || ((2019 - year) > 99)){
        var outstr = year < 2000 ? 'CENTENARIAN' : 'JUVENILE';
        outstr = year < 2019 ? outstr : 'FRAUDULENT';
        console.log('ATTEMPED ' + outstr + ' INPUT ORDER');
        contact.vars.bad_nid_count = (parseInt(contact.vars.bad_nid_count) || 0) + 1;
        var bad_nids = JSON.parse(contact.vars.bad_nids || '{}');
        bad_nids[contact.vars.bad_nid_count] = input;
        contact.vars.bad_nids = JSON.stringify(bad_nids);
        contact.save();
        return false;
    }
    return true;
}
