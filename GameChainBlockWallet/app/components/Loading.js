/**
 * Created by necklace on 2016/12/21.
 */
import React from 'react'
import { Spin } from 'antd';


class Loading extends React.Component {
    constructor(props) {
        super(props);
        this.state = {progress: 0};
    }

    componentDidMount() {
        this.timer = setInterval(() => {
            let p = this.state.progress;
            p += 1;
            if (p > 7) p = 0;
            this.setState({progress: p});
        }, 70);
    }

    componentWillUnmount() {
        this.timer && clearTimeout(this.timer);
        this.timer = null;
    }

    render() {
        return (
            <div className="loading">
                <div className="example" ><Spin /></div>
                {/* {this.state.progress}1 */}
            </div>
        );
    }
}

export default Loading;