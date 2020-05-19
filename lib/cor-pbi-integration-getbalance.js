/*
powerbi integration for get balance
needs some cleaning
*/

module.exports = function(client){
    var GBTable = project.getOrCreateDataTable("GetBalance");
    var GBRow = GBTable.createRow({vars:{'District': client.DistrictName,'Site': client.SiteName,'Group': client.GroupName,'AccountNumber': state.vars.account_number,'PhoneNumber': contact.phone_number}});
    GBRow.save();
    //Create row in stats table
    var StatsTable = project.getOrCreateDataTable("MobileStats");    
    DateString = String(moment().format("DD-MM-YYYY"));
    StatsCursor = StatsTable.queryRows({vars: {'date': DateString,'site': client.SiteName}});
    StatsCursor.limit(1);
    if (StatsCursor.hasNext()){
        var StatsRow = StatsCursor.next();
        StatsRow.vars.countBalance = Number(StatsRow.vars.countBalance)+Number(1);
        StatsRow.save();
        console.log("stats row found");
    }
    else{
        var NewStatsRow = StatsTable.createRow({vars: {'site':client.SiteName,'district':client.DistrictName,'countBalance':Number(1),'date': DateString}});
        NewStatsRow.save();
    }
};
