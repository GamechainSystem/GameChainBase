/**
 * Created by necklace on 2017/1/22.
 */
import React from "react";
import BaseComponent from "../BaseComponent";
import AccountSelectInput from "../wallet/AccountSelectInput";
import AmountSelector from "../wallet/AmountSelectInput";
import utils from "../../../common/utils";
import connectToStores from 'alt-utils/lib/connectToStores';
import BalanceComponent from "../Utility/BalanceComponent";

//stores
import AccountStore from "../../stores/AccountStore";
import {ChainStore} from "bitsharesjs";
import AssetStore from "../../stores/AssetStore";
import TransactionConfirmStore from "../../stores/TransactionConfirmStore";
import WalletUnlockStore from "../../stores/WalletUnlockStore";

//actions
import AccountActions from "../../actions/AccountActions";
import WalletUnlockActions from "../../actions/WalletUnlockActions";

import { Modal,message } from 'antd';


const warning = msg => {
    message.warning(msg);
};

class Transfer extends BaseComponent {
    static getInitialState() {
        return {
            from_name: "",
            to_name: "",
            from_account: null,
            to_account: null,
            amount: "",
            asset_id: null,
            asset: null,
            memo: "",
            error: null,
            propose: false,
            propose_account: "",
            feeAsset: null,
            fee_asset_id: "1.3.0",
            maxSendAmount:0,
            isSetMaxSendAmount:false,

            transfer_memo_fee:0
        };
    };

    constructor(props) {
        super(props);
        this.state = Transfer.getInitialState();

        this.init();
    

        this.onTrxIncluded = this.onTrxIncluded.bind(this);
    }

    init(){
        let {query} = this.props.location;
        
        if (query.from) {
            this.state.from_name = query.from;
            ChainStore.getAccount(query.from);
        }
      
        if (query.amount) this.state.amount = query.amount;
        if (query.asset) {
            this.state.asset_id = query.asset;
            this.state.asset = ChainStore.getAsset(query.asset);
        }
        if (query.memo) this.state.memo = query.memo;
        let currentAccount = AccountStore.getState().currentAccount;

        //if (!this.state.from_name&& query.to !== currentAccount )// 
        this.state.from_name = currentAccount;

        // console.info('this.state.isSetMaxSendAmount',this.state.isSetMaxSendAmount);
        this.state.isSetMaxSendAmount=false;

        if (query.to) {
            this.state.to_name = query.to;
            ChainStore.getAccount(query.to);
        }
        // else{
        //     this.state.to_name=currentAccount
        // }
    }
    componentWillMount() {
        this.nestedRef = null;   
    }

    componentWillUnmount() {
        AccountStore.unlisten(this.init);
        // AccountStore.unlisten(this.onFeeAmountChange);
    }
    // onFeeAmountChange(){
    //     let transaction=TransactionConfirmStore.getState().transaction;
    //     if('isOnlyGetFee' in transaction&&transaction.isOnlyGetFee){
    //         console.info('transaction111',transaction);
    //         let fee=Number(transaction.operations[0][1].fee.amount);
    //         if(!isNaN(fee)){
    //             this.setState({transfer_memo_fee:fee});
    //         }
    //     }
    // }
    componentDidMount(){
        AccountStore.listen(this.init.bind(this));        
        // TransactionConfirmStore.listen(this.onFeeAmountChange.bind(this)); 
    }

    onFromAccChange(from_account) {
        this.setState({from_account, error: null});
    }

    onFromChange(from_name) {
        let asset = undefined;
        let amount = undefined;
        this.setState({from_name, error: null, propose: false, propose_account: ""});
    }

    onToAccChange(to_account) {
        this.setState({to_account, error: null});
    }

    onToChange(to_name,to_account) {
        this.setState({to_name, error: null});
    }

    onAmountChanged({amount, asset}) {
        if (!asset) {
            return;
        }
        this.onFeeChanged({asset});
        this.setState({isSetMaxSendAmount:false});
        this.setState({amount, asset, asset_id: asset.get("id"), error: null});
        
    }

    onMemoChanged(e) {
        this.setState({memo: e.target.value});
        // console.info('this.onDoTransfer(e,true)',this.onDoTransfer(e,true));
    }

    onFeeChanged({asset}) {
        this.setState({isSetMaxSendAmount:false});        
        this.setState({feeAsset: asset, error: null});
    }

    setNestedRef(ref) {
        this.nestedRef = ref;
    }

    /**
     * 点击余额
     * @param asset_id
     * @param balance_id
     * @param fee
     * @param fee_asset_id
     * @param e
     */
    onBalanceClick(asset_id, balance_id, fee, fee_asset_id, e,isSetAmount=true) {
        let balanceObject = ChainStore.getObject(balance_id);
        let transferAsset = ChainStore.getObject(asset_id);
      //  let feeAsset = ChainStore.getObject(fee_asset_id);
        if (balanceObject) {
            
            let amount = utils.get_asset_amount(balanceObject.get("balance"), transferAsset);
            amount = parseFloat((amount - (asset_id === fee_asset_id ? fee : 0)).toFixed(8));

            if(isSetAmount){
                this.setState({amount});                
            }else{
                this.setState({
                    maxSendAmount:amount,
                    isSetMaxSendAmount:true
                });               
            }
        }
    }

    onTrxIncluded(confirm_store_state) {
        if (confirm_store_state.included && confirm_store_state.broadcasted_transaction) {
            TransactionConfirmStore.unlisten(this.onTrxIncluded);
            TransactionConfirmStore.reset();
        } else if (confirm_store_state.closed) {
            TransactionConfirmStore.unlisten(this.onTrxIncluded);
            TransactionConfirmStore.reset();
        }
    }

    onDoTransfer(e,isOnlyGetFee=false) {
        // e.preventDefault();
        this.setState({error: null});
        let asset = this.state.asset;

        let account_balances = this.state.from_account.get("balances").toJS();
        let asset_types = Object.keys(account_balances);

        let {from_name,to_name,to_account,from_account}=this.state;

        if(!from_account){
            warning('请输入支付的账户名');
            return;
        }

        if(from_account.get('name')!=from_name&&from_account.get('id')!=from_name){
            warning('请输入正确的支付账户名');
            return;
        }

        if(!to_account){
            warning('请输入收款的账户名');
            return;
        }

        if(to_account.get('name')!=to_name&&to_account.get('id')!=to_name){
            warning('请输入正确的收款账户名');
            return;
        }

        if(from_name==to_name){
            warning('支付账户名和收款账户名不能相同');
            return;
        }

        if(!asset||!asset_types.length){
            warning('请检查您的资产');
            return;
        }

        let precision = utils.get_asset_precision(asset.get("precision"));
        let amount = (this.state.amount+"").replace(/,/g, "");

        if(this.state.maxSendAmount<=0){
            warning(`可用余额不足`);
            return;
        }

        if(Number(amount)>this.state.maxSendAmount){
            warning(`可用余额不足,可用余额${this.state.maxSendAmount}`);
            return;
        }
        
        if(amount<=0){
            warning('请输入正确的转账金额');
            return;
        }
        
        AccountActions.transfer(
            this.state.from_account.get("id"),
            this.state.to_account.get("id"),
            parseInt(amount * precision, 10),
            asset.get("id"),
            this.state.memo ? new Buffer(this.state.memo, "utf-8") : this.state.memo,
            this.state.propose ? this.state.propose_account : null,
            this.state.feeAsset ? this.state.feeAsset.get("id") : "1.3.0",
            isOnlyGetFee
        ).then(() => {
            TransactionConfirmStore.unlisten(this.onTrxIncluded);
            TransactionConfirmStore.listen(this.onTrxIncluded);
        }).catch(e => {
            let msg = e.message ? e.message.split('\n')[1] : null;
            console.error("error: ", e, msg);
            this.setState({error: msg});
        });
    }

    render() {
        //console.debug('props', this.props)
        let from_error = null;
        let {
            from_account, to_account, asset, asset_id, propose,
            amount, error, to_name, from_name, memo, feeAsset, fee_asset_id,
            transfer_memo_fee
        } = this.state;
        //console.debug('state:', this.state)
        let from_my_account = AccountStore.isMyAccount(from_account);
        if (from_account && !from_my_account && !propose) {
            from_error = <span>
                {this.formatMessage('account_not_yours')}
            </span>;
        }
        let asset_types = [], fee_asset_types = [];
        let balance = null;       
        
        let globalObject = ChainStore.getObject("2.0.0");
        // console.info('globalObject',globalObject);
        let fee =transfer_memo_fee||utils.estimateFee("transfer", null, globalObject);

        if (from_account && from_account.get("balances") && !from_error) {

            let account_balances = from_account.get("balances").toJS();
            asset_types = Object.keys(account_balances).sort(utils.sortID);
            // console.info('asset_types111',asset_types);

            fee_asset_types = Object.keys(account_balances).sort(utils.sortID);
            for (let key in account_balances) {
                let asset = ChainStore.getObject(key);
                let balanceObject = ChainStore.getObject(account_balances[key]);
                if (balanceObject && balanceObject.get("balance") === 0) {
                    asset_types.splice(asset_types.indexOf(key), 1);
                    if (fee_asset_types.indexOf(key) !== -1) {
                        fee_asset_types.splice(fee_asset_types.indexOf(key), 1);
                    }
                }

                if (asset) {
                    if (asset.get("id") !== "1.3.0" && !utils.isValidPrice(asset.getIn(["options", "core_exchange_rate"]))) {
                        fee_asset_types.splice(fee_asset_types.indexOf(key), 1);
                    }
                }
            }

            // 完成估价
            let core = ChainStore.getObject("1.3.0");
            if (feeAsset && feeAsset.get("id") !== "1.3.0" && core) {

                let price = utils.convertPrice(core, feeAsset.getIn(["options", "core_exchange_rate"]).toJS(), null, feeAsset.get("id"));
                fee = utils.convertValue(price, fee, core, feeAsset);

                if (parseInt(fee, 10) !== fee) {
                    fee += 1;
                }
            }
            if (core) {
                fee = utils.limitByPrecision(utils.get_asset_amount(fee, feeAsset || core), feeAsset ? feeAsset.get("precision") : core.get("precision"));
            }

            // console.info('asset_types2222',asset_types);

            if (asset_types.length > 0) {
                let current_asset_id = asset ? asset.get("id") : asset_types[0];
                let feeID = feeAsset ? feeAsset.get("id") : "1.3.0";
                let accBalance = account_balances[current_asset_id];

                let balanceObject = ChainStore.getObject(accBalance);


                if(ChainStore.getObject(current_asset_id)&&this.state.from_name&&balanceObject.get("balance")&&this.state.isSetMaxSendAmount==false){
                    this.onBalanceClick(current_asset_id, accBalance, fee, feeID,null,false); 
                }

                balance = (
                    <span className="orangeRed underline"
                          onClick={this.onBalanceClick.bind(this, current_asset_id, accBalance, fee, feeID)}>
                                <BalanceComponent balance={accBalance}/>
                    </span>
                );
            } else {
                balance = null;
            }
        } else {
            let core = ChainStore.getObject("1.3.0");
            fee_asset_types = ["1.3.0"];
            if (core) {
                fee = utils.limitByPrecision(utils.get_asset_amount(fee, feeAsset || core), feeAsset ? feeAsset.get("precision") : core.get("precision"));
            }
        }
        let submitButtonClass = "green-btn";
        if (!from_account || !to_account || !amount || amount === "0" || !asset || from_error)
            submitButtonClass = "disabled-btn";

            // console.info('asset_types2222',asset_types);
        return (
            <div className="content content_transfer">
                 <ul className="breadcrumb" >
                    <li>
                        <a >账户</a> 
                    </li>
                    <li className="active">
                        转账
                    </li>
                </ul>
                <div className="div_main_body">
                    <div className="transfer_user">
                        <AccountSelectInput
                            lable={this.formatMessage('transfer_from')}
                            placeholder={this.formatMessage('transfer_from_ph')}
                            account={from_name}
                            accountName={from_name}
                            error={from_error}
                            onChange={this.onFromChange.bind(this)} onAccountChanged={this.onFromAccChange.bind(this)}/>
                        
                            <div className="div_icon">
                                <i className="glyphicon glyphicon-forward" ></i>
                            </div>
                       
                        <AccountSelectInput
                            ref="transfer_to"
                            lable={this.formatMessage('transfer_to')}
                            placeholder={this.formatMessage('transfer_to_ph')}
                            account={to_name}
                            accountName={to_name}
                            onChange={this.onToChange.bind(this)} onAccountChanged={this.onToAccChange.bind(this)}/>
                    </div>

                    {asset_types.length?<AmountSelector
                        label={this.formatMessage('transfer_amount')}
                        amount={amount}
                        onChange={this.onAmountChanged.bind(this)}
                        asset={asset_types.length > 0 && asset ? asset.get("id") : ( asset_id ? asset_id : asset_types[0])}
                        assets={asset_types}
                        balance={balance}
                        placeholder={this.formatMessage('transfer_amount_ph')}/>:null}

                    <div className="text-img-input">
                        <div className="text-box clear-leftpadding">
                            <div className="label"><span>{this.formatMessage('transfer_memo')}</span></div>
                            <div className="input">
                                <input type="text" value={memo} placeholder={this.formatMessage('transfer_memo_ph')}
                                    onChange={this.onMemoChanged.bind(this)}/>
                            </div>
                        </div>
                    </div>
                    
                    <AmountSelector
                        refCallback={this.setNestedRef.bind(this)}
                        label={'基础手续费'} disabled={true}
                        amount={fee}
                        onChange={this.onFeeChanged.bind(this)}
                        asset={fee_asset_types.length && feeAsset ? feeAsset.get("id") : ( fee_asset_types.length === 1 ? fee_asset_types[0] : fee_asset_id ? fee_asset_id : fee_asset_types[0])}
                        
                        assets={fee_asset_types}

                        disabled={true}
                    />

                    <div className="operate">
                    <button onClick={this.onDoTransfer.bind(this)} className="uk-button uk-button-primary uk-button-large">{this.formatMessage('transfer_send')}</button>
                        {/* <input type="button" className={submitButtonClass} value={this.formatMessage('transfer_send')}
                            onClick={this.onDoTransfer.bind(this)}/> */}
                    </div>
                </div>
            </div>
        );
    }
}
class TransferContainer extends React.Component {
    static getPropsFromStores() {
        return {
            cachedAccounts: AccountStore.getState().cachedAccounts,
            myAccounts: AccountStore.getMyAccounts(),
            accountBalances: AccountStore.getState().balances,
            assets: AssetStore.getState().assets,
            account_name_to_id: AccountStore.getState().account_name_to_id,
            searchAccounts: AccountStore.getState().searchAccounts
        };
    }

    static getStores() {
        return [AccountStore, AssetStore];
    }

    render() {
        //console.debug('props:',this.props)
        return <Transfer {...this.props} />;
    }
}
export default connectToStores(TransferContainer);