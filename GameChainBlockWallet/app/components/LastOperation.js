/**
 * Created by necklace on 2017/1/17.
 */
import React from "react";
import BaseComponent from "./BaseComponent";
import AccountName from "./Utility/AccountName";

import {ChainTypes as grapheneChainTypes} from "bitsharesjs";
import AltContainer from "alt-container";
import {RecentTransactions} from "./dashboard/Operation";

//actions
import AccountActions from "../actions/AccountActions";

//stores
import AccountStore from "../stores/AccountStore";


const {operations} = grapheneChainTypes;

import { Modal, Button } from 'antd';


class LastOperation extends BaseComponent {
    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            currentBlockInfo:null,
            visible:false
        };
    }
    getHistory(accountsList, filterOp, customFilter) {
        let history = [];
        let seen_ops = new Set();
        for (let account of accountsList) {
            if(account) {
                let h = account.get("history");
                if (h) history = history.concat(h.toJS().filter(op => !seen_ops.has(op.id) && seen_ops.add(op.id)));
            }
        }
        if (filterOp) {
            history = history.filter(a => {
                return a.op[0] === operations[filterOp];
            });
        }

        if (customFilter) {
            history = history.filter(a => {
                let finalValue = customFilter.fields.reduce((final, filter) => {
                    switch (filter) {
                        case "asset_id":
                            return final && a.op[1]["amount"][filter] === customFilter.values[filter];
                            break;
                        default:
                            return final && a.op[1][filter] === customFilter.values[filter];
                            break;
                    }
                }, true)
                return finalValue;
            });
        }
        return history;
    }

    
    componentDidMount() {    
        AccountStore.listen(this.onCurrentBlockInfoChange.bind(this)); 
        AccountActions.setGlobalLoading.defer(false); 
    }
    componentWillUnmount() {
        AccountStore.unlisten(this.onCurrentBlockInfoChange);
    }
    onCurrentBlockInfoChange(){
        this.setState({
            currentBlockInfo:AccountStore.getState().currentBlockInfo,
            visible:!!AccountStore.getState().currentBlockInfo
        });
    }
    handleOk = (e) => {
        this.setState({
          visible: false,
        });
    }
    render() {
        let {linkedAccounts} = this.props;
        let {currentBlockInfo}=this.state;
        if(currentBlockInfo){
            currentBlockInfo.time=currentBlockInfo.timestamp.replace("T"," ");
            currentBlockInfo.time=new Date(new Date(currentBlockInfo.time).getTime()+8*60*60*1000).format("yyyy年MM月dd日 HH:mm:ss");
        }
        let accountCount = linkedAccounts.size;
        return (
            <div className="content vertical-flex vertical-box">
                 <ul className="breadcrumb" style={{marginBottom:"0"}}>
                    <li>
                        <a >账户</a> 
                    </li>
                    <li className="active">
                        近期活动
                    </li>
                </ul>
                <div className="last-operation vertical-flex vertical-box">
                    <div className="last-operation-header-c">
                        <div className="last-operation-header" >
                            <span>{this.formatMessage("lastOperation_operation")}</span>
                            <span>{this.formatMessage("lastOperation_info")}</span>
                            <span >手续费</span>
                            <span >时间</span>
                            <span >区块信息</span>
                        </div>
                    </div>
                    {/* <div className="separate2"></div> */}
                    {accountCount ? <RecentTransactions
                        accountsList={linkedAccounts}
                        limit={9}
                    /> :
                        <div className="last-operation-body vertical-flex scroll">
                        </div>
                    }
                </div>

                {currentBlockInfo?<Modal
                    title={'区块#'+currentBlockInfo.id}
                    visible={this.state.visible}
                    footer={[
                        <Button key="submit" type="primary"  onClick={this.handleOk}>
                           确定
                        </Button>,
                      ]}
                    >
                    <ul>
                        <li>
                            <span>日期</span>：
                            <span>{currentBlockInfo.time}</span>
                        </li>
                        <li>
                            <span>见证人</span>：
                            <AccountName account={currentBlockInfo.witness} /> 
                        </li>
                        <li>
                            <span>上一个区块</span>：
                            {currentBlockInfo.previous}
                        </li>
                        <li><span>交易数量</span>：{currentBlockInfo.transactions.length}</li>
                   </ul>
                </Modal>:null}     
            </div>
        );
    }
}

class LastOperationContainer extends React.Component {
    render() {
        return (
            <AltContainer
                stores={[AccountStore]}
                inject={{
                    linkedAccounts: () => {
                        return AccountStore.getState().linkedAccounts;
                    }
                }}>
                <LastOperation/>
            </AltContainer>
        );
    }
}
export default LastOperationContainer;