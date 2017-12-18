/**
 * Created by xiangxn on 2016/12/10.
 */
import React from 'react';
import BaseComponent from "./BaseComponent";
import AltContainer from "alt-container";
import WalletUnlockStore from "../stores/WalletUnlockStore";
import WalletDb from "../stores/WalletDb";

import AccountStore from "../stores/AccountStore";
import WalletManagerStore from "../stores/WalletManagerStore";

import connectToStores from 'alt-utils/lib/connectToStores';

import {ChainStore} from "bitsharesjs";

//actions
import WalletUnlockActions from "../actions/WalletUnlockActions";
import PopupMenu, {menuItems} from './PopupMenu';
import ScanActions from "../actions/ScanActions";
import AccountActions from "../actions/AccountActions";

import WalletActions from "../actions/WalletActions";

import { Icon,Modal,Button,Popover,notification } from 'antd';
const confirm = Modal.confirm;

import AccountImage from "./Utility/AccountImage";

class NavigationBar extends BaseComponent {


    constructor(props) {
        super(props);
        this.state = {
            menuTop: '0',
            menuLeft: '0',
            isShowMenu: false,
            navIndex:1,
            topRightMenus:[
                {path:"/create-account",text:"创建账户",icon:"glyphicon-user"},
                {path:"/settings",text:"设置",icon:"glyphicon-cog"},
                {path:"",text:"",icon:"glyphicon-lock"},
                {path:"",text:"",icon:"glyphicon-off"}
            ],
            accountsPopoverStatus:false
        };
    }

    showMenu() {
        let rect = this.refs.menuBtn.getBoundingClientRect();
        /*
         let menu = this.refs.mainMenu;
         menu.setState({top: rect.top + rect.height - 30, left: rect.left - 145, isShow: !menu.state.isShow});
         */
        //console.debug(rect);
        this.setState({
            menuTop: '.6rem',//(rect.top + rect.height) / 100,
            menuLeft: '.12rem'// (rect.left + rect.width) / 100,
        });
        let menuState = this.refs.menu.state;
        this.refs.menu.setState({isShow: !menuState.isShow});
    }

    onMenuClick(data) {
        console.debug(data);
        //this.setState({isShow: false});
        //browserHistory.push(data.url);
    }

    onMenuItemClick(data) {
        //console.debug(data);
        if (data.url === 'reload') {
            window.location.reload();
        } else if (data.url === 'scan') {
            ScanActions.scan(this.context.router.location);
            this.context.router.push('/' + data.url);
        }
    }

    onBackClick() {
        this.context.router.goBack();
    }

    onUnlockClick(e) {
        // e.preventDefault();
        let wallet = WalletDb.getWallet();
        if (!wallet) {
            this.context.router.push('/create-account');
            return;
        }
        if (WalletDb.isLocked()) WalletUnlockActions.unlock();
        else WalletUnlockActions.lock();
    }

    getTitle() {
        let url = this.context.router.location.pathname;
        if (url === "/") {
            return this.context.intl.formatMessage({id: "menu_index"});
        }
        if(url==="/init-error"){
            return this.context.intl.formatMessage({id:"menu_settings"});
        }
        url = url.substring(1);
        let menu = menuItems.find((item) => {
            if (item.url === "/") return false;
            return url.startsWith(item.url.substring(1));
        });
        if (menu !== undefined) {
            return this.context.intl.formatMessage({id: menu.name});
        } else {
            return null;
        }
    }

    //SettingsStore.getSetting('apiServer')
    //()=>SettingsActions.changeSetting({setting: "locale", value: "cn"})
    onTopRightMenuClick(index){
        // console.info(e);
        if(index==0&&AccountStore.getState().currentAccount){
            if( AccountStore.getState().linkedAccounts.size<=1){
              this.setState({accountsPopoverStatus:false})                  
            }
            return;
        }

        this.setState({
            navIndex:index,
        });
        sessionStorage.setItem("navIndex",index);

        let path=this.state.topRightMenus[index].path;
        if(path){
            this.context.router.push(path);                   
        }
        
        if(index==2){
            this.onUnlockClick();
        }else if(index==3){
            this.onDeleteWallet();
        }
        
        this.props.onTopRightMenuClick&&this.props.onTopRightMenuClick();
    }
    onDeleteWallet(){
        //console.info();
        let current_wallet = WalletManagerStore.getState().current_wallet;
        let title = this.formatMessage('message_title');
        let msg = this.formatMessage('wallet_confirmDelete');
        console.info("current_wallet",current_wallet);  
        let names= WalletManagerStore.getState().wallet_names;
        console.info("names",names);
        WalletUnlockActions.unlock().then(() => {
           confirm({
                title:'确认退出当前钱包吗? 请确认已备份钱包或私钥', //'确认退出当前钱包吗?',//title
                // content: msg,
                onOk:()=>{
                  AccountActions.setGlobalLoading.defer(true);   
                 
                  WalletManagerStore.onDeleteWallet(current_wallet).then(()=>{
                    // let linkedAccounts =AccountStore.getState().linkedAccounts.toArray().sort();
                    // AccountActions.setCurrentAccount.defer(linkedAccounts.length?linkedAccounts[0]:null);  
                    AccountActions.setCurrentAccount.defer(null); 
                    if (names.size > 1) {
                        let wn = null;
                        names.forEach(name => {
                            //alert(name+","+current_wallet);
                            if (name !== current_wallet) {
                                wn = name;
                            }
                        });
                       // alert(wn);
                        if (wn) WalletActions.setWallet(wn);
                    }

                    setTimeout(() => {
                        window.location.reload();
                    }, 1000); 
                  }); 
                }
              });
        });
    }
    componentDidMount(){
        this.setState({
            navIndex: sessionStorage.getItem("navIndex"),
        });

        ChainStore.getObject("2.0.0")        
    }
    onAccountItemClick(accountName){
        this.setState({accountsPopoverStatus:false})          
        if(accountName!=AccountStore.getState().currentAccount){
            AccountActions.setCurrentAccount.defer(accountName);  
            notification["success"]({
                message: '当前活跃账户为 '+accountName
            });    
        }   
    }
    handleVisibleChange = (visible) => {
        this.setState({ accountsPopoverStatus:visible });
    }
    render() {
        let titleClass = "top-title";
        // if (this.context.router.location.pathname == "/init-error") {
        //     return (
        //         <div className="header">
        //             <div className={titleClass}>{this.getTitle()}</div>
        //         </div>
        //     );
        // }
        let props = this.props;
        //console.debug(this.context.router);
        let backBtn = null;
        if (this.context.router.location.pathname !== "/") {
            backBtn = (<div className="top-back" onClick={this.onBackClick.bind(this)}>&lt;</div>);
        } else {
            titleClass = "top-left-title";
        }
        let accountName=AccountStore.getState().currentAccount
        let statusStyle={
            display:accountName?'block':'none'
        }
        let names = AccountStore.getState().linkedAccounts.toArray().sort();
        let icon;

        let accounts=(
            <ul className="ul_accounts">
                 {names.map(accountNameItem=>{
                     return (<li className={accountNameItem==accountName?"current-account":null} onClick={this.onAccountItemClick.bind(this,accountNameItem)} ><AccountImage account={accountNameItem}/> {accountNameItem}</li>)
                 })}
                {/* <li><AccountImage account={accountName}/> {accountName}</li> */}
           </ul>
        )
        return (
         <nav className="navbar navbar-default"  role="navigation"  >
            <div className="navbar-header">
               <a className="navbar-brand" href="#"></a>
            </div>

            {/* <div className="collapse navbar-collapse"> */}
                {/* <ul className="nav navbar-nav">
                    <li className={this.state.navIndex==0?"active":null} data-index="0" onClick={this.onNavClick.bind(this,0)}  >
                         <a >资产</a>
                    </li>
                    <li className={this.state.navIndex==1?"active":null}  data-index="1" onClick={this.onNavClick.bind(this,1)} >
                         <a >近期活动</a>
                    </li>
                </ul> */}

                <ul className={`nav navbar-nav navbar-right ${accountName?"logined":''}`}>
                    {
                        this.state.topRightMenus.map((item,index)=>{
                            
                            return (
                               <li  onClick={this.onTopRightMenuClick.bind(this,index)} className={this.state.navIndex==index?"active":null} >
                                    {  index!=0?(<a className="li_a" >
                                                { index!=2?(<i className={`glyphicon ${item.icon}`}></i>):(<Icon type={this.props.locked?'lock':'unlock'} />) }
                                                <span> {item.text} </span>
                                            </a>):<Popover placement="bottom"  title='账户列表'
                                            visible={this.state.accountsPopoverStatus}
                                            content={accounts}
                                            onVisibleChange={this.handleVisibleChange}
                                            trigger="click">
                                                    <a className="li_a" >
                                                        {accountName?<AccountImage account={accountName}/>:<i className="glyphicon glyphicon-user"></i>}
                                                        <span>{accountName||"创建账户"} </span>
                                                    </a>
                                         </Popover>}
                               </li>
                            )
                        })
                    }
                    {/* <li className={this.state.navIndex==0?"active":null} >
                        <a className="li_a" ><i className="glyphicon glyphicon-user"></i><span>{accountName?accountName:"创建账户"}</span></a>
                    </li>
                    <li>
                        <a className="li_a" ><i className="glyphicon glyphicon-cog"></i><span>设置</span></a>
                    </li>
                    <li className="dropdown">
                          <a className="li_a" ><i className="glyphicon glyphicon-lock"></i></a>
                    </li> */}
                </ul>
            {/* </div> */}
            
        </nav>
            // <div className="header">
            //     <div className={titleClass}>{this.getTitle()}</div>
            //     {backBtn}
            //     <div className="top-right">
            //         <div ref="lockBtn" className="ico-lock" onClick={this.onUnlockClick.bind(this)}>
            //             {this.props.locked ? 'x' : 'w'}
            //         </div>
            //         <div ref="menuBtn" className="ico-menu" onClick={this.showMenu.bind(this)}>p</div>
            //     </div>
            //     <PopupMenu ref="menu" top={this.state.menuTop} left={this.state.menuLeft}
            //                onMenuItemClick={this.onMenuItemClick.bind(this)}
            //     />
            // </div>
        );
    }
}


class NavigationBarContainer extends React.Component {
    onTopRightMenuClick(){
        this.props.onTopRightMenuClick();
    }
    render() {
        return (
            <AltContainer store={WalletUnlockStore}>
                <NavigationBar onTopRightMenuClick={this.onTopRightMenuClick.bind(this)}/>
            </AltContainer>
        )
    }
}

export default NavigationBarContainer