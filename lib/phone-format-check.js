/*
module to check if phone numbers look like phone numbers
*/

module.exports = function(pn){
    pn = String(pn).replace(/\D/g,'');
    if(pn.length == 10){
        var first_digits = pn.slice(0,3);
        if(first_digits == '072' || first_digits == '073' || first_digits == '078'){
            return true;
        }
    }
    else if(pn.length == 12){
        var first_digits = pn.slice(0,5);
        if(first_digits == '25072' || first_digits == '25073' || first_digits == '25078'){
            return true;
        }
    }
    else if(pn.length == 9){
        var first_digits = pn.slice(0,2);
        if(first_digits == '72' || first_digits == '73' || first_digits == '78'){
            return true;
        }
    }
    else{
        return false;
    }
}
