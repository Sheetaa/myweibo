var storage = window.localStorage,
    access_token = storage.getItem("access_token"),
    uid = storage.getItem("uid"),
    faces = JSON.parse(storage.getItem("faces")),
    unreadCount,// 对象
    totalUnread = 0,// 数字
    statusUnread = 0,
    esUnread;// 除了未读微博数以外的所有未读消息数目

/*chrome.browserAction.onClicked.addListener(function(){
    chrome.windows.create({url: "popup.html", type: "popup", width: 620, height: 700});
})*/

if(storage.getItem("access_token") == null){
    chrome.browserAction.setIcon({path:"images/amazing_weibo_offline.jpg"});
    chrome.browserAction.setBadgeText({text: ""});
}
setInterval(function(){
    access_token = storage.getItem("access_token");
    uid = storage.getItem("uid");
    if(storage.hasOwnProperty("statusUnread")){
        statusUnread = Number(storage.getItem("statusUnread"));
    } else statusUnread = 0;
    if(storage.hasOwnProperty("esUnread")){
        esUnread = Number(storage.getItem("esUnread"));
    } else esUnread = 0;
}, 1000);
//获取表情符号icon地址
if(faces == null || faces.error != null){
    fGetFaces();
}
function fGetFaces(){
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function(){
        if(xhr.readyState != 4){
            return;
        }
        if(xhr.responseText){
            if(xhr.responseText.error != null){
                fGetFaces();
            } else {
                storage.setItem("faces", xhr.responseText);
            }
        }
    };
    xhr.open("get", "https://api.weibo.com/2/emotions.json?access_token="+access_token);
    xhr.send(null);
}
setInterval(function(){
    fGetUnreadCount();
    if(storage.hasOwnProperty("unreadCount")){
        if(totalUnread != 0){
            chrome.browserAction.setBadgeText({text: totalUnread+""});
        }
        chrome.runtime.sendMessage(unreadCount);
    }
}, 15000);

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
                statusUnread += unreadCount.status;
                esUnread = unreadCount.follower + unreadCount.cmt + unreadCount.dm + unreadCount.mention_status + unreadCount.mention_cmt + unreadCount.group + unreadCount.notice + unreadCount.invite + unreadCount.badge + unreadCount.photo;
                totalUnread = statusUnread + esUnread;
                storage.setItem("statusUnread", statusUnread);
                storage.setItem("esUnread", esUnread);
            }
        }
    };
    xhr.open("get", "https://rm.api.weibo.com/2/remind/unread_count.json?access_token="+access_token+"&uid="+uid, false);
    xhr.send(null);
}