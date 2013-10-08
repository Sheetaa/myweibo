var APP_KEY = "3947487124",
    APP_SECRET = "4c98313725656a176f05490df82294c4",
    // REDIRECT_URI = "chrome-extension://fpkjjgofghdhnnlkpomfohihmppjmpof/options.html";
    REDIRECT_URI = "https://api.weibo.com/oauth2/default.html",
    CODE,
    access_token;

$(function(){
  $("#addAccount").click(function(){
    window.open("https://api.weibo.com/oauth2/authorize?client_id="+APP_KEY+"&redirect_uri="+REDIRECT_URI);
    // $.ajax({
    //   url: 'https://api.weibo.com/oauth2/authorize',
    //   type: 'post',
    //   dataType: 'json',
    //   data: {
    //     client_id: APP_KEY,
    //     redirect_uri: REDIRECT_URI
    //   },
    //   success: function(data){
    //     console.log(data);
    //   },
    //   error: function(jqXHR, textStatus, errorThrown){
    //     console.log(jqXHR);
    //     console.log(textStatus);
    //     console.log(errorThrown);
    //   }
    // });
  });
  $("#code").on("change", function(){
    $.ajax({
      url: 'https://api.weibo.com/oauth2/access_token',
      type: 'post',
      dataType: 'json',
      async: false,
      data: {
        client_id: APP_KEY,
        client_secret: APP_SECRET,
        grant_type: "authorization_code",
        code: CODE,
        redirect_uri: REDIRECT_URI
      },
      success: function(data){
        console.log(data);
        access_token = data.access_token;
      }
    });
  });
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
  if(changeInfo.status === "loading" && tab.url.indexOf(REDIRECT_URI+"?code=") === 0){
    var d = OAuth.decodeForm(tab.url);
    CODE = d.code;
    $("#code").val(CODE);
    chrome.tabs.remove(tabId);
  }
});