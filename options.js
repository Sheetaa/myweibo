var APP_KEY = "3947487124",
    APP_SECRET = "4c98313725656a176f05490df82294c4",
    REDIRECT_URI = "http://baidu.com";

$(function(){
  $.ajax({
    url: 'https://api.weibo.com/oauth2/authorize',
    type: 'post',
    dataType: 'json',
    data: {
      client_id: APP_KEY,
      redirect_uri: REDIRECT_URI
    },
    success: function(data){
      console.log(data);
    },
    error: function(jqXHR, textStatus, errorThrown){
      console.log(jqXHR);
      console.log(textStatus);
      console.log(errorThrown);
    }
  });
});