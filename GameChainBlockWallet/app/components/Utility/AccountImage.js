/**
 * Created by xiangxn on 2017/2/19.
 */
import React,{PropTypes} from "react";
import Identicon from "./Identicon";
import { Icon } from 'antd';

class AccountImage extends React.Component{
    static propTypes = {
        src: PropTypes.string,
        account: PropTypes.string,
        size: PropTypes.object.isRequired
    };
    static defaultProps = {
        src: "",
        account: "",
        size: {height: 120, width: 120}
    };

    render(){
        let {account, image} = this.props;
        let {height, width} = this.props.size;
        let custom_image = image ?
            <img className="img" src={image} /> :(account?
            <Identicon id={account} account={account} size={this.props.size}/>:<Icon type="question" />);
        return (
            // <div className="icon"><span>U</span>{custom_image}</div>
            <div className="icon">{custom_image}</div>
        );
    }
}

export default AccountImage;