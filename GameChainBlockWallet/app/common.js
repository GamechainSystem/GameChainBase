import WalletDb from "./stores/WalletDb";
import WalletUnlockActions from "./actions/WalletUnlockActions";

import { Modal } from 'antd';
import Immutable from 'immutable';

export const update_ls_sha1s=function(current_wallet){
    let ls_sha1s=localStorage.getItem("sha1s");
    if(ls_sha1s){
        ls_sha1s=JSON.parse(ls_sha1s);
        ls_sha1s=ls_sha1s.filter(s_item=>{
            return s_item.wallet_name!=current_wallet;
        })
        if(ls_sha1s.length>0){
            localStorage.setItem("sha1s",JSON.stringify(ls_sha1s));
        }else{
            localStorage.setItem("sha1s","");
        }
    }
}

export const unlockBcl=function(account){
    return WalletUnlockActions.unlock().then(()=>{
        return new Promise((resolve, reject)=>{
            let accountName=account;
            if(typeof account!="string"){
                accountName=account.get("name");
            }
            bcl.getUserInfo(accountName,function(res){
                if(res.success){
                    // console.info("typeof account",typeof account);
                    if(typeof account=="string"){
                        account=Immutable.fromJS(res.data.account);
                    }
                    let active = permissionsFromImmutable(account.get("active"));
                    let activePublicKey = (active.keys && active.keys.size > 0) ? active.keys.get(0) : '';
                    let activePrivateKey = (activePublicKey !== '') ? toWif(activePublicKey) : '';
                    // console.info('activePrivateKey',activePrivateKey);
                    if(activePrivateKey){    
                        bcl.privateKeyLogin({
                            privateKey:activePrivateKey,
                            callback:res=>{
                                if(res.status==1){
                                    resolve();
                                }else{
                                    warning(res.statusText);
                                }
                            }  
                        })
                    }   
                }else{
                    warning(res.statusText);
                }
            });       
        })
    })   
}

function toWif(publicKey) {
    let privateKeyObj = WalletDb.getPrivateKey(publicKey);
    if (privateKeyObj && (privateKeyObj.toWif !== undefined && privateKeyObj.toWif !== null)) {
        return privateKeyObj.toWif();
    }
    return "";
}

function permissionsFromImmutable(auths) {
    let threshold = auths.get("weight_threshold");
    let account_auths = auths.get("account_auths");
    let key_auths = auths.get("key_auths");
    let address_auths = auths.get("address_auths");

    let accounts = account_auths.map(a => a.get(0));
    let keys = key_auths.map(a => a.get(0));
    let addresses = address_auths.map(a => a.get(0));

    let weights = account_auths.reduce((res, a) => {
        res[a.get(0)] = a.get(1);
        return res;
    }, {});
    weights = key_auths.reduce((res, a) => {
        res[a.get(0)] = a.get(1);
        return res;
    }, weights);
    weights = address_auths.reduce((res, a) => {
        res[a.get(0)] = a.get(1);
        return res;
    }, weights);

    return {threshold, accounts, keys, addresses, weights};
}


const validateHexString=str=>{
    if (str == "") return true;
    str = str.substring(0, 2) == '0x' ? str.substring(2).toUpperCase() : str.toUpperCase();
    var re = /^[0-9A-F]+$/g;
    return re.test(str);
}

export const isValidTxHash=txHash=>{
    return txHash.substring(0, 2) == "0x" && txHash.length == 66 && validateHexString(txHash);
}