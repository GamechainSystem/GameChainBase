/**
 * Created by xiangxn on 2017/2/17.
 */
import React from "react";
import BaseComponent from "../BaseComponent"
import BindToChainState from "../Utility/BindToChainState";
import ChainTypes from "../Utility/ChainTypes";

class AccountName extends BaseComponent {
    static propTypes = {
         account: ChainTypes.ChainObject.isRequired
    };

    constructor(props) {
        super(props);
    }

    shouldComponentUpdate(nextProps) {
        if (nextProps.account.get("name") && this.props.account.get("name")
            && nextProps.account.get("name") === this.props.account.get("name")) {
            return false;
        }
        return true;
    }

    render() {
        console.info('this.props.account',this.props.account.toJS());
        let account_name = this.props.account.get("name");
        if (!account_name) {
            return <span>{this.props.account.get("id")}</span>;
        }
        return <span>{account_name}</span>;
    }
}
export default BindToChainState(AccountName);