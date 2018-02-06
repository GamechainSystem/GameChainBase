import React from 'react';

//stores
import AccountStore from "../stores/AccountStore";
import SettingsStore from '../stores/SettingsStore';
import NotificationStore from "../stores/NotificationStore";

import {ChainStore} from "bitsharesjs";
import {Apis} from "bitsharesjs-ws";

import AssetStore from "../stores/AssetStore";

//actions
import AccountActions from "../actions/AccountActions";
import BackupActions from "../actions/BackupActions";

//组件
import Loading from './Loading';
import NavigationBar from './NavigationBar';
import NotificationSystem from "react-notification-system";
import TransactionConfirm from "./TransactionConfirm";
import UnlockWallet from "./wallet/UnlockWallet";
import Settings from './Settings';
import Confirm from './layout/Confirm';
import GlobalSettingContainer from './containers/GlobalSettingContainer';

import AccountImage from "./Utility/AccountImage";

// import ReactDOM from 'react-dom';
import { Menu, Icon } from 'antd';
const SubMenu = Menu.SubMenu;
const MenuItemGroup = Menu.ItemGroup;

import { browserHistory } from 'react-router';

import { notification } from 'antd';
import { setTimeout } from 'timers';

function removeElement(_element){
    var _parentElement = _element.parentNode;
    if(_parentElement){
           _parentElement.removeChild(_element);
    }
}

class Root extends React.Component {
    static contextTypes = {
        router: React.PropTypes.object
    };
    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            synced: false,
            syncFail: false,
            disableChat: SettingsStore.getState().settings.get("disableChat", true),
            leftNavMenus:[
                {path:"/balance"},
                {path:"/last-operate"},
                {path:"/transfer"},
                {path:"/settings/backup"},
                {path:"/settings/import-backup"},
                {path:"/look-key"},
                {path:"/settings/import-key"}                
            ],
            activeMenuIndex:"-1",
            globalLoading:false
        };
    }

    onNotificationChange() {
        let _notification = NotificationStore.getState().notification;
        
        if (_notification.autoDismiss === void 0) {
            _notification.autoDismiss = 10;
        }

        notification[_notification.level]({
            message: _notification.message,
            duration:_notification.autoDismiss ,
        });
        return;
        if (this.refs.notificationSystem) this.refs.notificationSystem.addNotification(notification);
    }

    componentWillUnmount() {
        NotificationStore.unlisten(this.onNotificationChange);
        SettingsStore.unlisten(this.onSettingsChange);
        // AccountStore.unlisten(this.onGlobalLoadingStatusChange);    
    }

    componentDidMount() {     
        document.querySelector(".div_loading_c")&&removeElement(document.querySelector(".div_loading_c"));       
        try {
            NotificationStore.listen(this.onNotificationChange.bind(this));
            SettingsStore.listen(this.onSettingsChange.bind(this));

            AccountStore.listen(this.onGlobalLoadingStatusChange.bind(this)); 

            ChainStore.init().then(() => {
                this.setState({synced: true});
                Promise.all([
                    AccountStore.loadDbData()
                ]).then(() => {
                    //  AccountStore.tryToSetCurrentAccount();                        
                    
                    //  let linkedAccounts =AccountStore.getState().linkedAccounts.toArray().sort();
                    //   console.info("linkedAccounts",linkedAccounts);
                    //  if(linkedAccounts.length){
                    //     AccountActions.setCurrentAccount.defer(linkedAccounts[0]);    
                    //   }else{
                         AccountStore.tryToSetCurrentAccount();                        
                     // }
                
                    this.setState({loading: false, syncFail: false});
          
                }).catch(error => {
                    console.log("[Root.js] ----- ERROR ----->", error);
                    this.setState({loading: false});
                });
            }).catch(error => {
                console.log("[App.jsx] ----- ChainStore.init error ----->", error);
                let syncFail = error.message === "ChainStore sync error, please check your system clock" ? true : false;
                this.setState({loading: false, syncFail});
            });

        } catch (e) {
            console.error("error:", e);
        }
        
        let pathname=this.context.router.location.pathname;
        if(pathname=="/"||pathname=="/last-operate"){
            setTimeout(function(){
                document.querySelector(".ant-menu li.lastOperate")&&document.querySelector(".ant-menu li.lastOperate").click();
            },300)
        }
    }

    onSettingsChange() {
        let {settings} = SettingsStore.getState();
        if (settings.get("disableChat") !== this.state.disableChat) {
            this.setState({
                disableChat: settings.get("disableChat")
            });
        }
    }

    onGlobalLoadingStatusChange(){
        this.setState({
            globalLoading:AccountStore.getState().gloablLoaingStatus
        });
    }

    onGoTransfer(){
        this.context.router.push("/transfer");
        this.setState({activeMenuIndex:"2"});
    }
    leftMenuClick({ item, key, keyPath }){
        let current_path=window.location.hash.substr(1);

        if(key=="1"&&current_path!="/last-operate"&&current_path!="/"){
            //AccountActions.setGlobalLoading.defer(true);  
            this.setState({
                globalLoading:true
            });      
            setTimeout(()=>{
                this.navRouterGo(key);
            },300)
        }else{
            if(key!="4"){
                BackupActions.reset();
            }
            this.navRouterGo(key);
        }
    }

    navRouterGo(key){
        this.setState({activeMenuIndex:key});   
        let path=this.state.leftNavMenus[key].path;
        if(key=="0"){
            let accountName=AccountStore.getState().currentAccount;
            path+="/"+accountName;
        }

        this.context.router.push(path);
    }
    onTopRightMenuClick(){
        this.setState({activeMenuIndex:'-1'});
    }
    render() {
     
        let {disableChat, syncFail, loading,globalLoading} = this.state;
        let content = null;
        let accountName=AccountStore.getState().currentAccount
        let statusStyle={
            display:accountName?'block':'none'
        }
        if (syncFail) {
            content = (
                <Settings>
                    <GlobalSettingContainer/>
                </Settings>
            );
        } else if (loading) {
            content = <Loading/>;
        } else {
            content = (
                <div className="full vertical-box app_container">
                    <NavigationBar   onTopRightMenuClick={this.onTopRightMenuClick.bind(this)}/>

                    <div className="div_main_c">
                        <div className="left_side"  style={statusStyle} >
                             <header>
                               <AccountImage account={accountName}/>
                               <h4>{accountName}</h4>
                               <button onClick={this.onGoTransfer.bind(this)} className="uk-button uk-button-primary btn_transfer">转账</button>
                             </header>
                             <nav className="nav_menus">
                                <Menu
                                onClick={this.leftMenuClick.bind(this)}
                                selectedKeys={[this.state.activeMenuIndex]}
                                defaultOpenKeys={['sub1','sub2']}
                                mode="inline"
                                theme="dark"
                                >
                                <SubMenu key="sub1" title={<span><Icon type="mail" /><span>账户</span></span>}>
                                    <Menu.Item key="0"><Icon type="bank" />资产</Menu.Item>
                                    <Menu.Item key="1" className="lastOperate"><Icon type="solution" />近期活动</Menu.Item>
                                    <Menu.Item key="2"><Icon type="swap" />转账</Menu.Item>
                                </SubMenu>
                                  
                                <SubMenu key="sub2" title={<span><Icon type="credit-card" /><span>钱包管理</span></span>}>
                                    <Menu.Item key="3"><Icon type="export" />钱包备份</Menu.Item>
                                    <Menu.Item key="4"><Icon type="switcher" />恢复备份</Menu.Item>
                                    <Menu.Item key="5"><Icon type="key" />密钥查看</Menu.Item>
                                    <Menu.Item key="6"><Icon type="login" />导入私钥</Menu.Item>

                                    {/* <Menu.Item key="12">Option 12</Menu.Item> style={{display:accountName?"block":"flex"}} */}
                                </SubMenu>
                            </Menu>
                           </nav>
                        </div>
                        {globalLoading? <Loading/>:null}
                        <div className="right_content" style={{display:this.state.globalLoading?'none':'block',borderWidth:accountName?'1px':0}}  >
                             {this.props.children}
                        </div>
                    </div>
                   
                    <NotificationSystem ref="notificationSystem" allowHTML={true}/>
                    <TransactionConfirm/>
                    <UnlockWallet/>
                    <Confirm/>
                </div>
            );
        }
        //console.debug(content);
        return content;
    }
}

export default Root;