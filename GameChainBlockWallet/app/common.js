
export const update_ls_sha1s=function(current_wallet){
    let ls_sha1s=localStorage.getItem("sha1s");
    if(ls_sha1s){
        ls_sha1s=JSON.parse(ls_sha1s);
        ls_sha1s=ls_sha1s.filter(s_item=>{
            return s_item.wallet_name!=current_wallet;
        })
        if(ls_sha1s.length>0){
            localStorage.setItem("sha1s",JSON.stringify(ls_sha1s));
        }else{
            localStorage.setItem("sha1s","");
        }
    }
}