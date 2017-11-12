// Author: Marcin Zduniak
//
// To execute type:
// nodejs msg_op_return_store.js "Your message you want to store on-chain"
// Sample transaction created using this script: https://www.blocktrail.com/tBTC/tx/56fd34fe7390033bb74f620be94e7e01070e01449a6f5a6f1f955d14c1afe34f

const OP_RETURN_BTC_FEE = 0.0001;

function toHex(str) {
    var result = '';
    for (var i=0; i<str.length; i++) {
      result += str.charCodeAt(i).toString(16);
    }
    return result;
}

const { exec } = require('child_process');

if (process.argv.length <= 2) {
    console.error('Please specify word you want to store in the blockchain');
    return;
}

const op_return_data = process.argv[2];
if (op_return_data.length > 83) {
    console.error('Data to be stored can not be bigger then 83 characters');
    return;
}

// List all unspent outputs that we can use to fund our data storage transaction:
exec('bitcoin-cli listunspent 0', (err, stdout, stderr) => {
    if (err) {
      console.error(err);
      return;
    }
    let unspent = JSON.parse(stdout);
    if (unspent.length == 0) {
        console.error("No unspent transactions to fund fee for the data storage on chain");
        return;
    }

    // Prioritize outputs so we can use the one with highest priority first:
    for (var i = 0; i < unspent.length; i++) {
        let u = unspent[i];
        u.priority = u.amount * u.confirmations;
    }

    //Sort: highest priority first:
    unspent.sort((a, b) => b.priority - a.priority);

    let inputs = [];
    let inputsAmount = 0.0;
    for (var i = 0; i < unspent.length; i++) {
        let u = unspent[i];
        inputsAmount += u.amount;
        inputs.push(u);
        if (inputsAmount >= OP_RETURN_BTC_FEE) {
            break;
        }
    }

    // create change address:
    exec('bitcoin-cli getrawchangeaddress', (err, stdout, stderr) => {
        if (err) {
          console.error(err);
          return;
        }
        let changeAddress = stdout.trim();
        let changeAmount = (inputsAmount - OP_RETURN_BTC_FEE).toFixed(8);

        // create raw output:
        let rawOutputData = {};
        rawOutputData['data'] = toHex(op_return_data);
        rawOutputData[changeAddress] = changeAmount;
        let rawOutput = JSON.stringify(rawOutputData);

        //create raw inputs:
        let rawInputsAr = [];
        for (var i = 0; i < inputs.length; i++) {
            let input = inputs[i];
            rawInputsAr.push({
                txid: input.txid,
                vout: input.vout
            });
        }
        let rawInput = JSON.stringify(rawInputsAr);

        // Construct raw tx:
        exec(`bitcoin-cli -named createrawtransaction inputs='''${rawInput}''' outputs='''${rawOutput}'''`, (err, stdout, stderr) => {
            if (err) {
                console.error(err);
                return;
              }
              const rawTxHex = stdout.trim();

              // Sign raw tx:
              exec(`bitcoin-cli signrawtransaction ${rawTxHex}`, (err, stdout, stderr) => {
                if (err) {
                  console.error(err);
                  return;
                }
                const signedTx = JSON.parse(stdout).hex;

                // Propagate raw tx in the network:
                exec(`bitcoin-cli sendrawtransaction ${signedTx}`, (err, stdout, stderr) => {
                    if (err) {
                      console.error(err);
                      return;
                    }
                    const txHash = stdout.trim();
                    console.log('Message successfull created in bitcoin transaction with hash: \n' + txHash);
                  });
              });
        });
    });

  });