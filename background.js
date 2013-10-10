var storage = window.localStorage,
    access_token,
    uid,
    unreadCount,
    totalUnread;

if(storage.getItem("access_token") == null){
    chrome.browserAction.setIcon({path:"images/weibo_offline.jpg"});
    chrome.browserAction.setBadgeText({text: ""});
}
window.setInterval(function(){
    access_token = storage.getItem("access_token");
    uid = storage.getItem("uid");
    totalUnread = storage.getItem("totalUnread");
}, 1000);
//获取表情符号icon地址
if(storage.getItem("faces") == null){
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function(){
        if(xhr.readyState != 4){
            return;
        }
        if(xhr.responseText){
            storage.setItem("faces", xhr.responseText);
        }
    };
    xhr.open("get", "https://api.weibo.com/2/emotions.json?access_token="+access_token);
    xhr.send(null);
}
fUpdateIcon();
window.setInterval(function(){
    fUpdateIcon();
}, 10000);

function fGetUnreadCount(){
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function(){
        if(xhr.readyState != 4){
            return;
        }
        if(xhr.responseText){
            if(xhr.responseText !== '{"error":"invalid_access_token","error_code":21332,"request":"/2/remind/unread_count.json"}'){
                storage.setItem("unreadCount", xhr.responseText);
                unreadCount = JSON.parse(xhr.responseText);
                totalUnread = unreadCount.status + unreadCount.follower + unreadCount.cmt + unreadCount.dm + unreadCount.mention_status + unreadCount.mention_cmt + unreadCount.group + unreadCount.notice + unreadCount.invite + unreadCount.badge + unreadCount.photo;
                storage.setItem("totalUnread", totalUnread);
            }
        }
    };
    xhr.open("get", "https://rm.api.weibo.com/2/remind/unread_count.json?access_token="+access_token+"&uid="+uid, false);
    xhr.send(null);
}
function fUpdateIcon(){
    fGetUnreadCount();
    if(storage.hasOwnProperty("unreadCount") && storage.getItem("totalUnread") !== "0"){
        chrome.browserAction.setBadgeText({text: totalUnread+""});
    }
}