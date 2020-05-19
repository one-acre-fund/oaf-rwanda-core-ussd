$an_error = 0;
$chicken_client = 0;

console.log('pre_api');
var client = null;
var api = require('ext/Roster_v1_0_2/api');
var country = 'RW';
api.dataTableAttach('ExternalApis');

var admin_email = project.getOrCreateDataTable('admin_emails').queryRows({'name' : 'zach'}).next().vars.email;

var accnum = state.vars.account_number;
var country = 'RW';
api.verbose = true;
api.dataTableAttach('ExternalApis');
try{
    client_auth = api.authClient(accnum, country);
    if(client_auth){
        var client = api.getClient(accnum);
        state.vars.client_json = JSON.stringify(client);
        state.vars.client_name = client.ClientName;
        state.vars.client_district = client.DistrictName;
        state.vars.client_site = client.SiteName;
        var chicken_clients = project.getOrCreateDataTable('chicken_clients');
        var chick_curs = chicken_clients.queryRows({vars : {'account_number' : state.vars.account_number}});
        if(chick_curs.hasNext()){
            $chicken_client = 1;
        }
        console.log('name: ' +state.vars.client_name);
        console.log('district: ' +state.vars.client_district);
        console.log('site: ' +state.vars.client_site)
    }
}
catch(error){
		console.log('error : ' + error);
        sendEmail(admin_email, 'API Failure','API failure on account number ' + accnum + '\nError : ' + error + '\n' + JSON.stringify(client));
        client = null;
        $an_error = 1;
}
if(client === null){
    $an_error = 1;
}
console.log($chicken_client);
console.log(state.vars.account_number);