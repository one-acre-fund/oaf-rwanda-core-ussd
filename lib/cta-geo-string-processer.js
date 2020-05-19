/*
todo - convert object.keys into menu for geo loc
*/

module.exports = function(branch){
    if ('fo_name' in branch){
        try{
            var fo_phone = branch['fo_phone'].slice(2);
        }
        catch(error){
            console.log(error);
            var fo_phone = '';
        }
        return {'$FO_NAME' : branch['fo_name'], '$FO_PHONE' : fo_phone}
    }
    else{
        k = Object.keys(branch);
        out_str = ''
        for(i = 1; i < k.length + 1; i++){
            out_str = out_str + i + ': ' + k[i-1] + '\n';
        }
        return {'$GEO_MENU' : out_str};
    }
}
