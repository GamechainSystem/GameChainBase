/**
 * Created by necklace on 2017/1/4.
 */

import React from "react";
import BaseComponent from "../BaseComponent";
import XNSelect from "../form/XNSelect";
import connectToStores from 'alt-utils/lib/connectToStores';
import AccountNameInput from "./AccountNameInput";
import PasswordInput from "./PasswordInput";
import TextLoading from "../TextLoading";

import {ChainValidation, FetchChain, ChainStore} from "bitsharesjs";

//stores
import WalletDb from "../../stores/WalletDb";
import AccountStore from "../../stores/AccountStore";
import TransactionConfirmStore from "../../stores/TransactionConfirmStore";

//actions
import NotificationActions from "../../actions/NotificationActions";
import AccountActions from "../../actions/AccountActions";
import WalletActions from "../../actions/WalletActions";
import WalletUnlockActions from "../../actions/WalletUnlockActions";
import TransactionConfirmActions from "../../actions/TransactionConfirmActions";

import { message } from 'antd';

const warning = msg => {
    message.warning(msg);
};

class CreeateAccount extends BaseComponent {

    static getPropsFromStores() {
        return AccountStore.getState()
    }

    static getStores() {
        return [AccountStore];
    }

    constructor(props) {
        super(props);
        this.state = {
            validAccountName: false,
            accountName: "",
            validPassword: false,
            registrar_account: null,
            loading: false,
            error_message: null,
            disabledPwd:true
        };
        this.onFinishConfirm = this.onFinishConfirm.bind(this);
    }

    /*
     componentWillMount() {
     let my_accounts = AccountStore.getMyAccounts();
     let firstAccount = my_accounts.length === 0;
     if (!firstAccount) {
     this.setState({registrar_account: my_accounts[0]});
     }
     }
     */

    isValid() {
        let firstAccount = AccountStore.getMyAccounts().length === 0;
        let valid = this.state.validAccountName;
        if (!WalletDb.getWallet()) {
            console.log('this.state.validAccountName');
            console.log(this.state.validPassword);
            valid = valid && this.state.validPassword;
         
        }
        if (!firstAccount) {
            if(!this.state.registrar_account){
                this.setState({error_message: "请选择支付账户"});   
                warning("请选择支付账户");  
            }
            valid = valid && this.state.registrar_account;
        }
        return valid;
    }

    onAccountNameChange(e) {
        const state = {};
              
        if (e.errMsg) {
            // console.log(e.errMsg=="Account name should be longer");
            // if(e.errMsg.indexOf('be longer')>=0){
            //     e.errMsg="账户长度太短";
            // }
            state.error_message= e.errMsg;
            //this.setState({error_message: e.errMsg});
            // return;
        } else {
            state.error_message= null;            
            // this.setState({error_message: null});
        }
        if (e.valid !== undefined) state.validAccountName = e.valid;
        if (e.value !== undefined) state.accountName = e.value;
                
        state.disabledPwd=!WalletDb.getWallet()&&!ChainValidation.is_cheap_name(state.accountName);
        state.disabledPwd=this.isAccountExist(state.accountName);
         
        this.setState(state);
    }   
    isAccountExist(currentInputAccountName){
        return !!(AccountStore.getState().searchAccounts.find(a =>a===currentInputAccountName));    
    }
    onPasswordChange(e) {
        if (e.error) {
            this.setState({error_message: e.error, validPassword: !!e.valid});
        } else {
            this.setState({error_message: null, validPassword: !!e.valid});
        }
    }

    onRegistrarAccountChange(registrar_account) {
        registrar_account = registrar_account.value;
        let registrar = registrar_account ? ChainStore.getAccount(registrar_account) : null;

        /*console.debug('registrar:', registrar_account, registrar);
         registrar.map((v,k)=>{
         console.debug("属性：" + k + ",值：" + v);
         })*/

        let isLTM = false;
        if (registrar) {
            if (registrar.get("lifetime_referrer") == registrar.get("id")) {
                isLTM = true;
            }
        }
        if (registrar_account) {
            if (!isLTM) {
                this.setState({error_message: this.formatMessage('wallet_mustBeLTM')});
                warning(this.formatMessage('wallet_mustBeLTM'));
            } else {
                this.setState({registrar_account});
            }
        }
    }

    onFinishConfirm(confirm_store_state) {
        if (confirm_store_state.included && confirm_store_state.broadcasted_transaction) {
            TransactionConfirmStore.unlisten(this.onFinishConfirm);
            TransactionConfirmStore.reset();

            FetchChain("getAccount", this.state.accountName).then(() => {
                console.log("onFinishConfirm");
                this.props.router.push("/settings/backup");
            });
        }
    }

    //创建钱包
    createWallet(password) {
        return WalletActions.setWallet(
            "default", //wallet name
             password
        ).then(() => {
            console.log("Congratulations, your wallet was successfully created.");
        }).catch(err => {
            console.error("CreateWallet failed:", err);
            NotificationActions.addNotification({
                message: this.formatMessage('wallet_createCatch', {err: err}),
                level: "error",
                autoDismiss: 10
            })
        });
    }

    //创建账户
    createAccount(name) {
        let refcode = this.refs.refcode ? this.refs.refcode.value() : null;
        WalletUnlockActions.unlock().then(() => {
            this.setState({loading: true});
            AccountActions.createAccount(name, this.state.registrar_account, this.state.registrar_account, 0, refcode).then(() => {
                // User registering his own account
                if (this.state.registrar_account) {
                    this.setState({loading: false});
                    TransactionConfirmStore.listen(this.onFinishConfirm);
                } else { // Account registered by the faucet
                    FetchChain("getAccount", name, 9000).then(() => {
                        this.props.router.push("/settings/backup");
                    });
                }
            }).catch(error => {
                console.log("ERROR AccountActions.createAccount", error);
                let error_msg = error.base && error.base.length && error.base.length > 0 ? error.base[0] : "unknown error";
                if (error.remote_ip) error_msg = error.remote_ip[0];
                NotificationActions.addNotification({
                    message: this.formatMessage('wallet_createCatch', {err: name + '-' + error_msg}),
                    level: "error",
                    autoDismiss: 10
                });
                this.setState({loading: false});
            });
        });
    }

    //创建钱包和账户
    onSubmit(e) {
        e.preventDefault();
        let account_name = this.refs.accountName.refs.nameInput.getValue();
        if(!account_name){
            this.setState({error_message: "账户不能为空"}); 
            return;      
        }

        if(this.isAccountExist(account_name)){
            this.setState({error_message: "账户名已被他人使用"}); 
            return;   
        }

        if(!WalletDb.getWallet()&&!ChainValidation.is_cheap_name(account_name)){
            return;
        }

        if(this.refs.password){
            if(!this.refs.password.value()){
                this.setState({error_message: "钱包密码不能为空"}); 
                return;      
            }
            if(!this.refs.password.confirm_password_value()){
                this.setState({error_message: "请输入确认密码"}); 
                return;    
            }
        }    
        
        // console.info('this.isValid()this.isValid()')
        // console.info(!this.isValid());
        if (!this.isValid()) return;
        this.setState({loading: true});      
        let reg_account_name = this.state.registrar_account;
        console.info('WalletDb.getWallet()')
        console.info(WalletDb.getWallet());
        if (WalletDb.getWallet()) {
            ChainStore.getAccount(reg_account_name);
            TransactionConfirmActions.proposeFeePayingAccount(reg_account_name);
            this.createAccount(account_name);
        } else {
            let password = this.refs.password.value();
            this.createWallet(password).then(() => {
                this.createAccount(account_name)
            });
        }
    }
    goImportBackup(){
        this.context.router.push("/settings/import-backup");                  
    }

    goImportKey(){
        if(_config.online){
          this.context.router.push("/settings/import-key");   
        }else{
           NotificationActions.addNotification({
                message:"客户端版本暂不支持密钥恢复",
                level: "warning",
                autoDismiss: 6
           })
        }
    }

    render() {
        let my_accounts = AccountStore.getMyAccounts();

        let firstAccount = my_accounts.length === 0;
        let hasWallet = WalletDb.getWallet();

        let accountList = [];
        if (!firstAccount) {
            my_accounts.map((acc) => {
                accountList.push({value: acc, text: acc});
            });
        }
        //console.debug('my_accounts:', my_accounts);
        let rName = this.formatMessage('wallet_selectAccount_ph');
        if (this.state.registrar_account) {
            rName = this.state.registrar_account;
        }

        return (
            <div className="content regPanel_c">
               <div className="regPanel">
                  <h4>创建您的{hasWallet?"子":""}账户</h4>
                  <form>
                    <AccountNameInput
                        ref="accountName"
                        accountShouldNotExist={true} cheapNameOnly={firstAccount}
                        onChange={this.onAccountNameChange.bind(this)}
                        placeholder={this.formatMessage("wallet_accountName_ph")}
                    />
                    {!firstAccount ?
                        <XNSelect label={this.formatMessage('wallet_selectAccount')}
                                value={rName}
                                onChange={this.onRegistrarAccountChange.bind(this)}
                                data={accountList}/>
                        : null
                    }
                    {hasWallet ? null :
                        <PasswordInput
                            ref="password"
                            confirmation={true}
                            disabledPwd={this.state.disabledPwd}
                            onChange={this.onPasswordChange.bind(this)}
                        />
                    }

                    {this.state.error_message === null ? null :
                        <div className="message-box" >
                            {this.state.error_message}
                        </div>
                    }

                    <div className="operate">
                       {this.state.loading ? <TextLoading/> :
                        <button onClick={this.onSubmit.bind(this)}  className="uk-button uk-button-primary" style={{width:'100%'}} >{this.formatMessage('btn_ok')}</button>
                       }
                    </div>
                    <a onClick={this.goImportBackup.bind(this)}>从备份恢复钱包</a>
                    <div>
                      <a onClick={this.goImportKey.bind(this)}>从钱包密钥恢复钱包</a>
                    </div>
                        {/* <button type="button"  onClick={this.onSubmit.bind(this)} 
                         className="btn btn-warning">{this.formatMessage('btn_ok')}</button> */}
    
                    {/* <div className="operate">
                        {this.state.loading ? <TextLoading/> :
                            <input className="green-btn" type="button" value={this.formatMessage('btn_ok')}
                                onClick={this.onSubmit.bind(this)}/>
                        }
                    </div> */}                
                  </form>
                </div>   
            </div>
        );
    }
}

export default connectToStores(CreeateAccount);