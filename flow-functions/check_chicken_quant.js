//must set state.vars.max_chickens
//must set $client_name
//can return state.vars.chicken_confirm

var client_dat = JSON.parse(state.vars.client_json);
$client_name = client_dat.ClientName;
console.log('name : ' + $client_name + ' an : ' + state.vars.account_number + '\n' + client_dat);
var chicken_clients = project.getOrCreateDataTable('chicken_clients');
var client = chicken_clients.queryRows({vars: {'account_number' : state.vars.account_number}}).next();

var month = moment().format("MMMM");
console.log(month);
var calc_max_chicks = {
    'December' : function(client){
        var arrayLength = client_dat.BalanceHistory.length;
        $balance = '';
        $paid = 0;
        $credit = 0;
        for (var i = 0; i < arrayLength; i++) {
            if(client_dat.BalanceHistory[i].Balance > 0){
                $paid = client_dat.BalanceHistory[i].TotalCredit-client_dat.BalanceHistory[i].Balance;
                $balance = client_dat.BalanceHistory[i].Balance;
                $credit = client_dat.BalanceHistory[i].TotalCredit;
            }
        }
        if(!$paid){$paid = 0}
        if(!$credit){$credit = 0}
        if ($balance === ''){$balance = 0}
        $check_math =Math.min(Math.floor((Math.max($paid- $credit*0.6)/500)));
        $result = Math.max(Math.min(client.vars.ordered_chickens, $check_math),0);
        return $result;
    },
    'January' : function(client){
        var arrayLength = client_dat.BalanceHistory.length;
        $balance = '';
        $paid = 0;
        $credit = 0;
        for (var i = 0; i < arrayLength; i++) {
            if(client_dat.BalanceHistory[i].Balance > 0){
                $paid = client_dat.BalanceHistory[i].TotalCredit-client_dat.BalanceHistory[i].Balance;
                $balance = client_dat.BalanceHistory[i].Balance;
                $credit = client_dat.BalanceHistory[i].TotalCredit;
        
            }
        }
        if(!$paid){$paid = 0}
        if(!$credit){$credit = 0}
        if ($balance === ''){$balance = 0}
        $check_math = Math.max(Math.floor(($paid - client.vars.a_credit*0.6)/500),0);
        $result = Math.min(client.vars.ordered_chickens, $check_math);
        return $result;
    },
    'February' : function(client){
        var arrayLength = client_dat.BalanceHistory.length;
        
        $balance = '';
        $paid = 0;
        $credit = 0;
        for (var i = 0; i < arrayLength; i++) {
            if(client_dat.BalanceHistory[i].Balance > 0){
                $paid = client_dat.BalanceHistory[i].TotalCredit-client_dat.BalanceHistory[i].Balance;
                $balance = client_dat.BalanceHistory[i].Balance;
                $credit = client_dat.BalanceHistory[i].TotalCredit;
        
            }
        }
        if(!$paid){$paid = 0}
        if(!$credit){$credit = 0}
        if ($balance === ''){$balance = 0}
        $check_math = Math.max(Math.floor(($paid - client.vars.a_credit*0.6)/500),0);
        $result = Math.min(client.vars.ordered_chickens, $check_math);
        return $result;
    },
    'March' : function(client){
        var arrayLength = client_dat.BalanceHistory.length;
        $balance = '';
        $paid = 0;
        $credit = 0;
        $overpayment = 0;
        for (var i = 0; i < arrayLength; i++) {
            if(client_dat.BalanceHistory[i].Balance > 0){
                $paid = client_dat.BalanceHistory[i].TotalCredit-client_dat.BalanceHistory[i].Balance;
                $balance = client_dat.BalanceHistory[i].Balance;
                $credit = client_dat.BalanceHistory[i].TotalCredit;
            }
            if(client_dat.BalanceHistory[i].Balance < 0){
                $overpayment += client_dat.BalanceHistory[i].Balance;
            }
        }
        if(!$paid){$paid = 0}
        if(!$credit){$credit = 0}
        if ($balance === ''){$balance = 0}
        if($paid ===0 && $overpayment !== 0){$paid = (-1)*$overpayment}
        console.log('paid: ' + $paid + '\n$credit: ' + $credit + '\nbalance: ' + $balance + '\noverpayment: ' + $overpayment);
        $goal = min(client.vars.march_goal, client.vars.march_goal_alt);
        $goal_plus = $goal + client.vars.ordered_chickens * 500;
        $result = 0;
        if($paid >= $goal_plus){
            $result = client.vars.ordered_chickens;
        }
        else if($ <= $goal){
            $result = 0;
        }
        else{
            $result = client.vars.ordered_chickens - Math.floor(($paid - $goal) / 500)
        }
        return $result;
    },
    'April' : function(client){
        var arrayLength = client_dat.BalanceHistory.length;
        $balance = '';
        $paid = 0;
        $credit = 0;
        $overpayment = 0;
        for (var i = 0; i < arrayLength; i++) {
            console.log(client_dat.BalanceHistory[i].Balance);
            if(client_dat.BalanceHistory[i].Balance > 0){
                $paid = client_dat.BalanceHistory[i].TotalCredit-client_dat.BalanceHistory[i].Balance;
                $balance = client_dat.BalanceHistory[i].Balance;
                $credit = client_dat.BalanceHistory[i].TotalCredit;
            }
            if(client_dat.BalanceHistory[i].Balance < 0){
                $overpayment += client_dat.BalanceHistory[i].Balance;
            }
        }
        if(!$paid){$paid = 0}
        if(!$credit){$credit = 0}
        if ($balance === ''){$balance = 0}
        if($paid ===0 && $overpayment !== 0){$paid = (-1)*$overpayment}
        console.log('paid: ' + $paid + '\n$credit: ' + $credit + '\nbalance: ' + $balance + '\noverpayment: ' + $overpayment);
        $goal = min(client.vars.march_goal, client.vars.march_goal_alt)
        $goal_plus = $goal + client.vars.ordered_chickens * 500;
        $result = 0;
        if($paid >= $goal_plus){
            $result = client.vars.ordered_chickens;
        }
        else if($ <= $goal){
            $result = 0;
        }
        else{
            $result = client.vars.ordered_chickens - Math.floor(($paid - $goal) / 500)
        }
        return $result;
    },
    'placeholder' : function(client){
        return client.vars.ordered_chickens | 0;
    }
};

state.vars.max_chickens = calc_max_chicks[month](client);
if(client.vars.confirmed === 1){
    state.vars.confirmed_chickens = client.vars.confirmed_chickens;
    state.vars.confirmation_number = client.vars.confirmation_number;
    $confirmed = 1;
}
