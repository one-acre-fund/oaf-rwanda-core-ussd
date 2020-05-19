var chick_loc_info = project.getOrCreateDataTable('chick_loc_info');
var cursor = chick_loc_info.queryRows({vars : {'site' : state.vars.client_site}});
var admin_email = project.getOrCreateDataTable('admin_emails').queryRows({'name' : 'zach'}).next().vars.email;

if(!cursor.hasNext()){
    sendEmail(admin_email, 'Chicken problems','chicken get vet row 2');
}
var loc = cursor.next();
console.log(loc);
console.log(state.vars.client_site);
$vet_loc = loc.vars.vet_loc;