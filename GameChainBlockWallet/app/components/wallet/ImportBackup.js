/**
 * Created by necklace on 2017/1/12.
 */
import React from "react";
import BaseComponent from "../BaseComponent";
import connectToStores from 'alt-utils/lib/connectToStores';
import {PrivateKey} from "bitsharesjs";

//stores
import WalletManagerStore from "../../stores/WalletManagerStore";
import BackupStore from "../../stores/BackupStore";
import WalletDb from "../../stores/WalletDb";
import AccountStore from "../../stores/AccountStore";

//actions
import BackupActions, {backup, decryptWalletBackup} from "../../actions/BackupActions";
import WalletActions from "../../actions/WalletActions";
import NotificationActions from "../../actions/NotificationActions";
import AccountActions from "../../actions/AccountActions";

import { Steps } from 'antd';
const Step = Steps.Step;

import { message } from 'antd';
const warning = msg => {
    message.warning(msg);
};

class ImportBackup extends BaseComponent {

    static getPropsFromStores() {
        return {wallet: WalletManagerStore.getState(), backup: BackupStore.getState()};
    }

    static getStores() {
        return [WalletManagerStore, BackupStore];
    }

    constructor(props) {
        super(props);
        this.state = {
            verified: false,
            accept: false, 
            new_wallet: '',
            steps:[
                {stepText:"选择钱包文件"},
                {stepText:"输入钱包密码"},
                {stepText:"确认导入钱包"}
            ]
        };
    }

    onSelectClick(e) {
        let file = this.refs.file;
        file.click();
    }

    onFileUpload(e) {
        let file = e.target.files[0];
        // console.debug('onFileUpload',file);
        BackupActions.incommingWebFile(file);
        this.forceUpdate();
    }

    reset() {
        BackupActions.reset();
    }

    onRestore(e) {
        e.preventDefault();

        let {backup,wallet} = this.props;

        let has_current_wallet = !!wallet.current_wallet
        let wallet_name="";
        if (!has_current_wallet) {
            wallet_name="default";
        }else if(backup.name){
            wallet_name= backup.name.match(/[a-z0-9_-]*/)[0];
        }
     
        let ls_sha1s=localStorage.getItem("sha1s");
        let isExist=false;
        if(ls_sha1s){
            ls_sha1s=JSON.parse(ls_sha1s);
            isExist=ls_sha1s.some(item=>{
                return item.sha1==backup.sha1;
            })
        }else{
            ls_sha1s=[];
        }

    

        let pass = this.refs.password.value;
        let private_key = PrivateKey.fromSeed(pass || "");
        let contents = this.props.backup.contents;

        decryptWalletBackup(private_key.toWif(), contents).then(wallet_object => {
            if(isExist){
                warning("该钱包已经导入,请勿重复导入");
                return;
            }else{
                ls_sha1s.push({
                    wallet_name:wallet_name,
                    sha1:backup.sha1
                })
    
                localStorage.setItem("sha1s",JSON.stringify(ls_sha1s));
            }
            
            BackupStore.setWalletObjct(wallet_object);
            this.setState({verified: true});
            this.checkNewName();
        }).catch(error => {
            console.error("Error verifying wallet " + this.props.backup.name, error, error.stack);
            if (error === "invalid_decryption_key"){
                warning(this.formatMessage('wallet_createErrMsg6'))
            }
            else{
                warning("" + error)
            }     
        })
    }

    checkNewName() {
        let has_current_wallet = !!this.props.wallet.current_wallet
     
        if (!has_current_wallet) {
            let name = "default";
            WalletManagerStore.setNewWallet(name);
 
            WalletActions.restore(name, this.props.backup.wallet_object);
          
            this.setState({accept: true, new_wallet: name});
        }

        if (has_current_wallet && this.props.backup.name && !this.state.new_wallet) {
            let new_wallet = this.props.backup.name.match(/[a-z0-9_-]*/)[0];
            if (new_wallet)
                 this.setState({new_wallet});
               
        }     
        AccountActions.setCurrentAccount.defer(this.props.backup.wallet_object.linked_accounts[0].name);      
    }

    onNewNameChange(event) {
        let value = event.target.value;
        value = value.toLowerCase();
        if (/[^a-z0-9_-]/.test(value)) return;
        this.setState({new_wallet: value});
    }

    onAccept(e) {
        e.preventDefault();

        this.setState({accept: true});

        WalletManagerStore.setNewWallet(this.state.new_wallet);
        WalletActions.restore(this.state.new_wallet, this.props.backup.wallet_object);

        // this.reset();
        // this.pageReload();
    }
    pageReload(){        
        this.reset();
        this.context.router.push("/transfer");
        // setTimeout(function() {
        //     window.location.reload();
        // }, 300);                 
    }
    render() {
        let check = !!(new FileReader).readAsBinaryString;
        let checkMsg = check ? this.formatMessage('wallet_importBackupDes') : this.formatMessage('wallet_backup_err');
        let is_invalid = this.props.backup.contents && !this.props.backup.public_key;
        if (is_invalid) checkMsg = this.formatMessage('wallet_importBackup_invalidFormat');
        let content;
        let stepIndex=0;
        // console.info('this.props.backup.contents && this.props.backup.public_key')
        // console.info(this.props.backup.contents && this.props.backup.public_key);
        // alert(this.state.accept)
        if (this.props.backup.contents && this.props.backup.public_key) {
            if (this.state.accept) {
                stepIndex=2
                content=<div className="content">
                            <div className="message-box">
                                {this.formatMessage('wallet_importBackup_success', {name: this.state.new_wallet})}
                            </div>
                            <input className="green-btn" type="button"
                                value={this.formatMessage('btn_ok')}
                                onClick={this.pageReload.bind(this)}
                            />
                        </div>
            } else if (this.state.verified && !this.state.accept) {
                    stepIndex=1
                    content=<div className="content">
                        <div className="text-input">
                            <div className="text-label">{this.formatMessage("wallet_importBackup_name")}</div>
                            <input type="text"
                                   ref="newName"
                                   value={this.state.new_wallet}
                                   onChange={this.onNewNameChange.bind(this)}
                                   placeholder={this.formatMessage("wallet_importBackup_name_ph")}/>
                        </div>
                        <div className="operate">
                            <input className="green-btn" type="button" value="确认导入"
                                   onClick={this.onAccept.bind(this)}/>
                        </div>
                    </div>
            }else{
                checkMsg = <p className="middleSize">SHA1:{this.props.backup.sha1}</p>;
                stepIndex=1;
                content= <div className="content">   
                        <div className="message-box">
                            {checkMsg}
                        </div>
                        <div className="text-input">
                            <div className="text-label">{this.formatMessage("wallet_password")}</div>
                            <input autoComplete="off" type="password"
                                   ref="password"
                                   placeholder={this.formatMessage("wallet_password_ph")}/>
                        </div>
                        <div className="operate">
                            <input className="green-btn" type="button" value={this.formatMessage('wallet_importBackup_ok')}
                                   onClick={this.onRestore.bind(this)}/>
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                            <input className="green-btn" type="button"
                                   value={this.formatMessage('wallet_importBackup_reset')}
                                   onClick={this.reset.bind(this)}/>
                        </div>
                    </div>
            }
          
        }else{
            content= <div className="content">
                <div className="message-box">
                    <p className="text-muted"> {checkMsg}  备份文件不会上传至远端服务器，只在本地浏览器中进行处理</p>
                </div>
                {!check ? null :
                    <div className="operate">
                        <input className="green-btn" type="button"
                            value={this.formatMessage('wallet_selectFile')}
                            onClick={this.onSelectClick.bind(this)}
                        />
                        <input ref="file" type="file" style={{display: 'none'}}
                            onChange={this.onFileUpload.bind(this)}/>
                    </div>
                }
            </div>
        }

        return (
            <div className="content_import-backup" >
                 <ul className="breadcrumb" style={{marginBottom:"0"}}>
                        <li>
                            <a >钱包管理</a> 
                        </li>
                        <li className="active">
                            恢复备份
                        </li>
                  </ul>
                  <div className="div_steps">
                    {
                        this.state.steps.map((item,index)=>{
                            return (<div className={"step "+(index<=stepIndex?'active_step':'')} key={index}>
                                        <div className="div_bg">
                                           {index+1}  
                                        </div>  
                                        <p>{item.stepText}</p>  
                                    </div>  )
                        })
                    }
                  </div>
                  {/* <Steps current={stepIndex}>
                        <Step title="选择钱包文件"  />
                        <Step title="输入钱包密码"  />
                        <Step title="成功导入钱包"  />
                  </Steps>  */}
                  {content}    
            </div>
        );
        
    }
}


export default connectToStores(ImportBackup);