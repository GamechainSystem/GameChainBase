/**
 * Created by xiangxn on 2016/12/10.
 */


import './assets/loader';
import './app';

var _configParams={
    api_node:{
        url:"ws://47.97.101.131:8095",
        name:"GCS"
    },
    faucet_url:"http://47.97.101.131:3000",
    chainId:"a458b6e3d040d497e1dd6533c3b7e76553a06aabe7e0ee06a1fdce3f563b421b"                        
};

var bcl=new BlockChainLib(_configParams);

bcl.init(); 

(function (doc, win) {
    var docEl = doc.documentElement;
    var resizeEvt = 'orientationchange' in window ? 'orientationchange' : 'resize';
    var recalc = function () {
        var clientWidth = docEl.clientWidth;
        if (!clientWidth) return;
        if (clientWidth > 640) clientWidth = 640;
        docEl.style.fontSize = (clientWidth / 640 * 100).toFixed(1) + 'px';
    };
    recalc();
    if (!doc.addEventListener) return;
    // win.addEventListener(resizeEvt, recalc, false);
    
})(document, window);

Date.prototype.format = function (format) {
    var o = {
        "M+": this.getMonth() + 1, // month
        "d+": this.getDate(), // day
        "H+": this.getHours(), // hour
        "m+": this.getMinutes(), // minute
        "s+": this.getSeconds(), // second
        "q+": Math.floor((this.getMonth() + 3) / 3), // quarter
        "S": this.getMilliseconds()
        // millisecond
    }
    if (/(y+)/.test(format))
        format = format.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(format))
            format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
    return format;
}