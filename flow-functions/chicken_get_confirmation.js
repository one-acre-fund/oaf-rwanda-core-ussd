var admin_email = project.getOrCreateDataTable('admin_emails').queryRows({'name' : 'zach'}).next().vars.email;
var chicken_clients = project.getOrCreateDataTable('chicken_clients');
var client = chicken_clients.queryRows({vars: {'account_number' : state.vars.account_number}}).next();
$confirmed = 0;
console.log(client.vars.confirmation_number);
state.vars.confirmation_number = client.vars.confirmation_number;
if(client.vars.confirmed == 1){
        $confirmed = 1;
}