var storage = window.localStorage,
    APP_KEY = "3947487124",
    APP_SECRET = "4c98313725656a176f05490df82294c4",
    // REDIRECT_URI = "chrome-extension://fpkjjgofghdhnnlkpomfohihmppjmpof/options.html";
    REDIRECT_URI = "https://api.weibo.com/oauth2/default.html",
    access_token,
    uid,
    user;

$(function(){
  $("button").button();
  if(storage.getItem("access_token") == undefined){
    $("#logout").css("display", "none");
  } else {
    $("#login").css("display", "none");
  }
  $("#getCode").click(function(){
    window.open("https://api.weibo.com/oauth2/authorize?client_id="+APP_KEY+"&redirect_uri="+REDIRECT_URI);
  });
  $("#addAccount").click(function(){
    if($("#code").val() == ""){
      alert("请先获取授权码");
    } else {
      console.log($("#code").val());
      $.ajax({
        url: 'https://api.weibo.com/oauth2/access_token',
        type: 'post',
        dataType: 'json',
        async: false,
        data: {
          client_id: APP_KEY,
          client_secret: APP_SECRET,
          grant_type: "authorization_code",
          code: $("#code").val(),
          redirect_uri: REDIRECT_URI
        },
        success: function(data){
          console.log(data);
          access_token = data.access_token;
          storage.setItem("access_token", access_token);
        }
      });
      $.ajax({
        url: 'https://api.weibo.com/2/account/get_uid.json',
        type: 'get',
        dataType: 'json',
        async: false,
        data: {
          access_token: access_token
        },
        success: function(data){
          uid = data.uid;
          storage.setItem("uid", uid);
        }
      });
      $.ajax({
        url: 'https://rm.api.weibo.com/2/remind/unread_count.json',
        type: 'get',
        dataType: 'json',
        async: false,
        data: {
          access_token: access_token,
          uid: uid
        },
        success: function(data){
          storage.setItem("unreadCount", JSON.stringify(data));
        }
      });
      $.ajax({
        url: 'https://api.weibo.com/2/users/show.json',
        type: 'get',
        dataType: 'json',
        async: false,
        data: {
          access_token: access_token,
          uid: uid
        },
        success: function(data){
          user = data;
          fAddUserInfo();
          storage.setItem("user", JSON.stringify(data));
          $("#logout").css("display", "block");
          $("#login").css("display", "none");
          chrome.browserAction.setIcon({path:"images/weibo.png"});
          chrome.browserAction.setBadgeText({text: ""});
          alert("添加成功");
        }
      });
    }
  });
  $("#rmAccount").click(function(){
    $.ajax({
      url: 'https://api.weibo.com/oauth2/revokeoauth2',
      type: 'get',
      dataType: 'json',
      data: {access_token: access_token},
      success: function(data){
        storage.removeItem("access_token");
        storage.removeItem("uid");
        storage.removeItem("user");
        storage.removeItem("unreadCount");
        storage.removeItem("totalUnread");
        $("#code").val("");
        $("#logout").css("display", "none");
        $("#login").css("display", "block");
        chrome.browserAction.setIcon({path:"images/weibo_offline.jpg"});
        chrome.browserAction.setBadgeText({text: ""});
        alert("注销成功");
      }
    });
  });
  if(storage.getItem("user") != undefined){
    user = JSON.parse(storage.getItem("user"));
    fAddUserInfo();
  }
});

function fAddUserInfo(){
  $("div.tip-face").html("<img src='"+user.profile_image_url+"'/>");
  $("div.tip-name").html("<strong>"+user.screen_name+"</strong>");
  if(user.verified){
    $("div.tip-name").append("<img src='images/verified.gif' />");
  }
  $("div.tip-info").html("<strong>微博</strong> "+user.statuses_count+" <strong>粉丝</strong> "+user.followers_count+" <strong>关注</strong> "+user.friends_count+" <strong>收藏</strong> "+user.favourites_count);
  $("div.tip-intro").html("<strong>简介</strong> "+user.description);
}

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
  if(changeInfo.status === "loading" && tab.url.indexOf(REDIRECT_URI+"?code=") === 0){
    var code = tab.url.substring(tab.url.indexOf("=")+1);
    $("#code").val(code);
    chrome.tabs.remove(tabId);
  }
});