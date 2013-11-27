var storage = window.localStorage,
    access_token,
    user,
    currentUser,
    flag_pageYOff_friends = 0,
    page_count_friends = 1,//公共微博的加载页数
    page_count_user = 1,//用户微博的加载页数
    page_count_mentions = 1,
    page_count_comments = 1,
    fancyGroup = 0;

/**
* 接受来自background传来的未读条目信息,分别添加到导航栏里
* 同步badge和导航栏上的未读条目数量
*/
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse){
  console.log(message);//传字符串得到字符串，传对象得到对象
  // 未读微博数
  if(message.status != 0){
    if($("li:eq(0) .unreadCount").length == 0){
      $("li:eq(0)").append("<div class='unreadCount'>"+message.status+"</div>");
    } else {
      var statusUnread = Number($("li:eq(0) .unreadCount").text()) + message.status;
      $("li:eq(0) .unreadCount").text(statusUnread);
    }
  }
  // 未读@数
  var mentions = message.mention_status + message.mention_cmt;
  if(mentions != 0){
    if($("li:eq(2) .unreadCount").length == 0){
      $("li:eq(2)").append("<div class='unreadCount'>"+mentions+"</div>");
    } else {
      $("li:eq(2) .unreadCount").text(mentions);
    }
  } else {
    if($("li:eq(2) .unreadCount").length != 0){
      $("li:eq(2) .unreadCount").remove();
    }
  }
  //未读评论数
  if(message.cmt != 0){
    if($("li:eq(3) .unreadCount").length == 0){
      $("li:eq(3)").append("<div class='unreadCount'>"+message.cmt+"</div>");
    } else {
      $("li:eq(3) .unreadCount").text(message.cmt);
    }
  } else {
    if($("li:eq(3) .unreadCount").length != 0){
      $("li:eq(3) .unreadCount").remove();
    }
  }
});

$(function(){
  if(storage.getItem("access_token") == undefined || storage.getItem("access_token") == ""){
    alert("请先添加账户");
  } else {
    access_token = storage.getItem("access_token");
    uid = storage.getItem("uid");
    user = storage.getItem("user");
    currentUser = user.screen_name;
  }

  $("#btnNewWinPopup").click(function(){
    chrome.windows.create({url: "popup.html", type: "popup", width: 620, height: 700});
    // window.open("popup.html", "_blank", "width=580");
  });
  $("#btnRefresh").click(function(){
    $("#friends_timeline").html("");
    page_count_friends = 1;
    fFriendsTimeline();
    if($("li:eq(0) .unreadCount").length != 0){
      $("li:eq(0) .unreadCount").remove();
      storage.setItem("statusUnread", "0");
    }
    var esUnread = Number(storage.getItem("esUnread"));
    if(esUnread != 0){
      chrome.browserAction.setBadgeText({text: storage.getItem("esUnread")});
    } else {
      chrome.browserAction.setBadgeText({text: ""});
    }
  });
  fFriendsTimeline();
  storage.setItem("statusUnread", "0");
  var esUnread = Number(storage.getItem("esUnread"));
  if(esUnread != 0){
    chrome.browserAction.setBadgeText({text: storage.getItem("esUnread")});
  } else {
    chrome.browserAction.setBadgeText({text: ""});
  }

  $("a[data-toggle='tab']:eq(0)").on("shown.bs.tab", function(event){
    window.scrollTo(0, flag_pageYOff_friends);
  });
  $("a[data-toggle='tab']:eq(1)").on("shown.bs.tab", function(event){
    // console.log(event.target);// 返回的是DOM对象
    // console.log(event.relatedTarget);
    if($(event.relatedTarget).text() == "首页"){
      flag_pageYOff_friends = $(window).scrollTop();
    }
    $("#user_timeline").html("");
    page_count_user = 1;
    fUserTimeline(user.screen_name);
    window.scrollTo(0, 0);
  });
  $("a[data-toggle='tab']:eq(2)").on("shown.bs.tab", function(event){
    if($(event.relatedTarget).text() == "首页"){
      flag_pageYOff_friends = $(window).scrollTop();
    }
    if($("li:eq(2) .unreadCount").length != 0 || $("#mentions").html() == ""){
      $("#mentions").html("");
      page_count_mentions = 1;
      fMentions();
      $("li:eq(2) .unreadCount").remove();
    }
    window.scrollTo(0, 0);
  });
  $("a[data-toggle='tab']:eq(3)").on("shown.bs.tab", function(event){
    if($(event.relatedTarget).text() == "首页"){
      flag_pageYOff_friends = $(window).scrollTop();
    }
    if($("li:eq(3) .unreadCount").length != 0 || $("#comments").html() == ""){
      $("#comments").html("");
      page_count_comments = 1;
      fComments();
      $("li:eq(3) .unreadCount").remove();
    }
    window.scrollTo(0, 0);
  });
  $("div.wb-container a[href=#user_timeline]").click(function(){
    $("#user_timeline").html("");
    page_count_user = 1;
    currentUser = $(this).attr("screen_name");
    fUserTimeline(currentUser);// 貌似这是微博API的问题，可以调用自己的微博列表，不可以返回别人的微博列表，只有应用通过审核之后才可以
    $("ul li:eq(1) a").tab("show");
  });
  
  console.log("window height: "+$(window).height());
  console.log("document height: "+$(document).height());
  $("body").bind('mousewheel', function(event, delta, deltaX, deltaY) {
    // console.log(delta, deltaX, deltaY); 
    // console.log(event.pageY); //event.pageY, pageX是鼠标当前位置到文档顶部的距离，注意是鼠标，不是滚动条
    // $(document).scrollTop() == $(window).scrollTop() True
    // console.log("document scrollTop: "+$(document).scrollTop());
    // console.log("window scrollTop: "+$(window).scrollTop());
    // console.log("window height: "+$(window).height());
    if($("#friends_timeline").attr("class") == "tab-pane active"){
      if($(window).scrollTop() + $(window).height() >= $(document).height()){
        console.log("Send a new request");
        fFriendsTimeline();
      }
    } else if($("#user_timeline").attr("class") == "tab-pane active"){
      if($(window).scrollTop() + $(window).height() >= $(document).height()){
        console.log("Send a new request");
        fUserTimeline(currentUser);
      }
    } else if($("#mentions").attr("class") == "tab-pane active"){
      if($(window).scrollTop() + $(window).height() >= $(document).height()){
        console.log("Send a new request");
        fMentions();
      }
    } else if($("#comments").attr("class") == "tab-pane active"){
      if($(window).scrollTop() + $(window).height() >= $(document).height()){
        console.log("Send a new request");
        fComments();
      }
    }
  });

  $(".updateDialog .hint").html("你还可以输入<strong>140</strong>个字").css("color", "grey");
  $(".updateDialog textarea").on("input", function(event){
    var count = 140 - $(this).val().length;
    if(count >= 0){
      if($(".updateDialog .hint").css("color") == "rgb(255, 0, 0)"){
        $(".updateDialog .hint").html("你还可以输入<strong>140</strong>个字").css("color", "grey");
      }
      $(".updateDialog .hint strong").text(count);
    } else {
      $(".updateDialog .hint").html("超过140字数限制").css("color", "red");
    }
  });
  $("#btn-publish").click(function(){
    var content = $(".updateDialog textarea").val();
    var option = $(".updateDialog select:selected").val();
    if(content.length == 0){
      alert("微博内容为空，请输入内容！");
    } else if(content.length > 140){
      alert("微博字数超过140字！");
    } else {
      $.ajax({
        url: 'https://api.weibo.com/2/statuses/update.json',
        type: 'post',
        dataType: 'json',
        data: {
          access_token: access_token,
          status: content,
          visiable: option
        },
        success: function(data){
          alert("发布成功");
          $("#tabs").tabs("option", "active", 0);
        }
      });
    }
  });
});

/**
*得到当前用户及其所关注的微博
*/
function fFriendsTimeline(){
  $.ajax({
    url: 'https://api.weibo.com/2/statuses/friends_timeline.json',
    type: 'get',
    dataType: 'json',
    async: false,
    data: {
      access_token: access_token,
      page: page_count_friends++
    },
    success: function(data){
      var statuses = data.statuses;
      for (var i = 0; i < statuses.length; i++) {
        var $wbContainer = fWeiboGenerator(statuses[i], false, false);
        $("#friends_timeline").append($wbContainer);
        fWeiboHover();
      }
    }
  });
}
/**
*得到某个用户的微博
*/
function fUserTimeline(screen_name){
  $.ajax({
    url: 'https://api.weibo.com/2/statuses/user_timeline.json',
    type: 'get',
    dataType: 'json',
    async: false,
    data: {
      access_token: access_token,
      screen_name: screen_name,
      page: page_count_user++
    },
    success: function(data){
      var statuses = data.statuses;
      for (var i = 0; i < statuses.length; i++) {
        var $wbContainer = fWeiboGenerator(statuses[i], false, false);
        $("#user_timeline").append($wbContainer);
        fWeiboHover();
      }
    }
  });
}
/**
*得到提及当前登陆用户的微博
*/
function fMentions(){
  $.ajax({
    url: 'https://api.weibo.com/2/statuses/mentions.json',
    type: 'get',
    dataType: 'json',
    async: false,
    data: {
      access_token: access_token,
      page: page_count_mentions++
    },
    success: function(data){
      var statuses = data.statuses;
      for (var i = 0; i < statuses.length; i++) {
        var $wbContainer = fWeiboGenerator(statuses[i], false, false);
        $("#mentions").append($wbContainer);
        fWeiboHover();
      }
    }
  });
}
/**
*得到当前登陆用户的评论
*/
function fComments(){
  $.ajax({
    url: 'https://api.weibo.com/2/comments/timeline.json',
    type: 'get',
    dataType: 'json',
    async: false,
    data: {
      access_token: access_token,
      page: page_count_comments++
    },
    success: function(data){
      var comments = data.comments;
      for (var i = 0; i < comments.length; i++) {
        var $wbContainer = fWeiboGenerator(comments[i], false, true);
        $("#comments").append($wbContainer);
        fWeiboHover();
      }
    }
  });
}

/**
*为微博添加鼠标悬浮事件，当鼠标悬浮在该条微博时，将所有类型的链接改变颜色以提示用户
*/
function fWeiboHover(){
  $("div.wb-container").hover(function(){
    $("div.username a", this).addClass("name-url");
    $("div.wb-text a", this).addClass("text-url");
    $("div.wb-from a", this).addClass("from-url");
    $("div.wb-handle a", this).addClass("name-url");
    $("div.wb-handle span", this).addClass("name-url");
  }, function(){
    $("div.username a", this).removeClass("name-url");
    $("div.wb-text a", this).removeClass("text-url");
    $("div.wb-from a", this).removeClass("from-url");
    $("div.wb-handle a", this).removeClass("name-url");
    $("div.wb-handle span", this).removeClass("name-url");
  });
}

/**
*生成一条微博的完整内容和格式
**/
function fWeiboGenerator(weibo, isRepost, isComment){
  var user = {
    id: weibo.user.id,
    screen_name: weibo.user.screen_name,
    gender: weibo.user.gender,
    statuses_count: weibo.user.statuses_count,
    followers_count: weibo.user.followers_count,
    friends_count: weibo.user.friends_count,
    favourites_count: weibo.user.favourites_count,
    description: weibo.user.description,
    verified: weibo.user.verified,
    profile_image_url: weibo.user.profile_image_url,
    profile_url: weibo.user.profile_url
  };
  // var tip = "<div class='tip'><div class='tip-face'><img src='"+user.profile_image_url+"'/></div>" +
  //           "<div class='tip-right'><div class='tip-name'>"+user.screen_name;
  // if(user.verified){
  //   tip += "<img src='images/verified.gif' />";
  // }
  // tip += "</div>" + "<div class='tip-info'><strong>微博</strong> "+user.statuses_count+" <strong>粉丝</strong> "+user.followers_count+" <strong>关注</strong> "+user.friends_count+" <strong>收藏</strong> "+user.favourites_count+"</div>";
  // if(user.description.length == 0)tip += "</div></div>";
  // else tip += "<div class='tip-intro'><strong>简介</strong> "+user.description+"</div></div></div>";

  var $wbContainer;
  if(isComment == true || (isComment == false && isRepost == false)){
    $wbContainer = $("<div class='wb-container'></div>");

    //每条微博的头像部分
    var $wbFace = $("<div class='wb-face'></div>");
    var $aFace = $("<a></a>");
    $aFace.attr({
      href: "http://www.weibo.com/"+user.profile_url,
      target: "_blank"
    });
    $aFace.append("<img width='50' height='50' /><br/>");
    $("img", $aFace).attr({
      title: user.screen_name,
      src: user.profile_image_url
    });
    $wbFace.append($aFace);
  } else {
    $wbContainer = $("<div class='wb-media-expand'></div>");
  }

  //微博主体部分
  var $wbDetail = $("<div class='wb-detail'></div>");
  var $aName = $("<a></a>");
  if(isRepost == false)$aName.append(user.screen_name);
  else $aName.append("@"+user.screen_name);
  $aName.attr({
    user_id: user.id,
    user_name: user.screen_name,
    href: "http://www.weibo.com/"+user.profile_url,
    target: "_blank"
  });
  var $username = $("<div class='username'></div>").append($aName);
  if(user.verified){
    $username.append("<img src='images/verified.gif' />");
  }
  $wbDetail.append($username);
  var $wbText = fParseURL(weibo.text);
  $wbDetail.append($wbText);

  //微博中的图片
  if(isComment == false){
    var pics = weibo.pic_urls;
    if(pics.length !== 0){
      var $wbPics = $("<div class='picture'></div>");
      //console.log(pics.length);
      for (var i = 0, m = pics.length; i < m; i++) {
        var thumbnail = pics[i].thumbnail_pic;
        var original = thumbnail.replace(/thumbnail/, "large");
        $wbPics.append("<a class='fancy' rel='group"+fancyGroup+"' href='"+original+"'><img src='"+thumbnail+"' /></a>");
        //$wbPics.append("<img src='"+pics[i].thumbnail_pic+"' />");
      }
      fancyGroup++;
      $("a.fancy").fancybox({
        helpers : {
          overlay : {
            css : {'background' : 'rgba(220, 220, 220, 0.8)'}
          },
          thumbs  : {
            width : 50,
            height  : 50
          }
        }
      });
      $wbDetail.append($wbPics);
    }
  }

  //被转发的原微博
  var $wbMediaExpand;
  if(isComment == true){
    $wbMediaExpand = fWeiboGenerator(weibo.status, true, false);
  } else if (isComment == false && weibo.retweeted_status != undefined){
    $wbMediaExpand = fWeiboGenerator(weibo.retweeted_status, true, false);
  }
  $wbDetail.append($wbMediaExpand);

  //微博时间来源和操作部分
  var $wbFrom = $("<div class='wb-from'></div>");
  var time = weibo.created_at.substring(4, weibo.created_at.length-11);
  $wbFrom.append(time+"    来自 "+weibo.source);
  var $wbHandle = $("<div class='wb-handle'></div>");
  var $btnGroup = $("<div class='btn-group btn-group-xs'></div>");
  if(isComment == true){
    $btnGroup.append("<button class='btn btn-default' data-toggle='modal' data-target='.replyDialog' title='回复'><span class='glyphicon glyphicon-pencil'></span></button><button class='btn btn-default' title='删除'><span class='glyphicon glyphicon-trash'></span></button>");
    $(".btn:eq(0)", $btnGroup).click(function(){
      var $reply = $("div.replyDialog");
      $(".dialog-header", $reply).html("回复 @"+user.screen_name+" 的微博");
      $("#btn-reply", $reply).click(function(){
        $.ajax({
          url: 'https://api.weibo.com/2/comments/reply.json',
          type: 'post',
          dataType: 'json',
          data: {
            access_token: access_token,
            cid: weibo.id,
            id: weibo.status.id,
            comment: $("textarea", $reply).val()
          },
          success: function(data){
            $(".replyDialog").modal("hide");
            alert("reply success");
          }
        });
      });
    });
    $(".btn:eq(1)", $btnGroup).click(function(){
      $.ajax({
        url: 'https://api.weibo.com/2/comments/destroy.json',
        type: 'post',
        dataType: 'json',
        data: {
          access_token: access_token,
          cid: weibo.id
        },
        success: function(data){
          alert("delete success");
        }
      });
    });
  } else {
    $btnGroup.append("<button class='btn btn-default' data-toggle='modal' data-target='.repostDialog' title='转发'><span class='glyphicon glyphicon-share'></span>"+weibo.reposts_count+"</button><button class='btn btn-default' data-toggle='modal' data-target='.commentsDialog' title='评论'><span class='glyphicon glyphicon-comment'></span>"+weibo.comments_count+"</button><button class='btn btn-default' title='收藏'></button>");
    $(".btn:eq(0)", $btnGroup).click(function(){
      var $repost = $("div.repostDialog");
      $(".dialog-header", $repost).html("转发 @"+user.screen_name+" 的微博");
      // $repost.dialog("option", "title", "转发 @"+user.screen_name+" 的微博");
      if(weibo.retweeted_status != undefined){
        $("textarea", $repost).val("//@"+user.screen_name+"："+weibo.text);
        var count = 140 - $("textarea", $repost).val().length;
        if(count >= 0){
          $(".hint", $repost).html("你还可以输入<strong>"+count+"</strong>个字").css("color", "grey");
        } else {
          $(".hint", $repost).html("超过140字数限制").css("color", "red");
        }
      } else {
        $("textarea", $repost).val("");
        $(".hint", $repost).html("你还可以输入<strong>140</strong>个字").css("color", "grey");
      }
      $("textarea", $repost).on("input", function(event){
        var count = 140 - $(this).val().length;
        if(count >= 0){
          if($(".hint", $repost).css("color") == "rgb(255, 0, 0)"){
            $(".hint", $repost).html("你还可以输入<strong>140</strong>个字").css("color", "grey");
          }
          $(".hint strong", $repost).text(count);
        } else {
          $(".hint", $repost).html("超过140字数限制").css("color", "red");
        }
      });
      $(".option", $repost).html("<input type='checkbox' id='rpcom' /><label for='rpcom'>转发的同时评论该微博</label><br/>");
      if(weibo.retweeted_status != undefined){
        $(".option", $repost).append("<input type='checkbox' id='rpcomrt' /><label for='rpcomrt'>转发的同时评论原微博</label>");
      }
      $("#btn-repost", $repost).click(function(){
        var status = $("textarea", $repost).val();
        var is_comment = 0;
        if($("#rpcomrt", $repost).length == 0 && $("#rpcom", $repost)[0].checked){
          is_comment = 1;
        }
        if($("#rpcomrt", $repost).length !== 0){
          if($("#rpcom", $repost)[0].checked == true && $("#rpcomrt", $repost)[0].checked == false){
            is_comment = 1;
          } else if($("#rpcom", $repost)[0].checked == false && $("#rpcomrt", $repost)[0].checked == true){
            is_comment = 2;
          } else if($("#rpcom", $repost)[0].checked && $("#rpcomrt", $repost)[0].checked){
            is_comment = 3;
          }
        }
        $.ajax({
          url: 'https://api.weibo.com/2/statuses/repost.json',
          type: 'post',
          dataType: 'json',
          async: false,
          data: {
            access_token: access_token,
            id: weibo.id,
            status: status,
            is_comment: is_comment
          },
          success: function(data){
            $(".repostDialog").modal("hide");
            $(".btn:eq(0)", $btnGroup).html("<span class='glyphicon glyphicon-share'></span>"+(weibo.reposts_count+1));
            alert("repost success");
          }
        });
        // $(this).dialog("close");
      });
      // $repost.dialog("open");
    });
    $(".btn:eq(1)", $btnGroup).click(function(){
      var $comments = $("div.commentsDialog");
      $(".dialog-header", $comments).html("评论 @"+user.screen_name+" 的微博");
      // $comments.dialog("option", "title", "评论 @"+user.screen_name+" 的微博");
      $("textarea", $comments).val("");
      $(".hint", $comments).html("你还可以输入<strong>140</strong>个字").css("color", "grey");
      $("textarea", $comments).on("input", function(event){
        var count = 140 - $(this).val().length;
        if(count >= 0){
          if($(".hint", $comments).css("color") == "rgb(255, 0, 0)"){
            $(".hint", $comments).html("你还可以输入<strong>140</strong>个字").css("color", "grey");
          }
          $(".hint strong", $comments).text(count);
        } else {
          $(".hint", $comments).html("超过140字数限制").css("color", "red");
        }
      });
      $(".option", $comments).html("");
      if(weibo.retweeted_status !== undefined){
        $(".option", $comments).append("<input type='checkbox' id='comretweeted' /><label for='comretweeted'>评论原微博</label>");
      }
      $("#btn-comment", $comments).click(function(){
        var comment = $("textarea", $comments).val();
        var comment_ori = 0;
        if($("#comretweeted", $comments).length !== 0 && $("#comretweeted", $comments)[0].checked){
            comment_ori = 1;
        }
        $.ajax({
          url: 'https://api.weibo.com/2/comments/create.json',
          type: 'post',
          dataType: 'json',
          async: false,
          data: {
            access_token: access_token,
            id: weibo.id,
            comment: comment,
            comment_ori: comment_ori
          },
          success: function(data){
            $(".commentsDialog").modal("hide");
            $(".btn:eq(1)", $btnGroup).html("<span class='glyphicon glyphicon-comment'></span>"+(weibo.comments_count+1));
            alert("comment success");
          }
        });
      });
      // $comments.dialog("open");
    });
    $(".commentsDialog").on("shown.bs.modal", function(e){
      $("textarea", this).focus();
    });
    $(".repostDialog").on("shown.bs.modal", function(e){
      $("textarea", this).focus();
    });
    $(".replyDialog").on("shown.bs.modal", function(e){
      $("textarea", this).focus();
    });
    if(weibo.favorited){
      $(".btn:eq(2)", $btnGroup).html("<span class='glyphicon glyphicon-heart'></span>");
    } else {
      $(".btn:eq(2)", $btnGroup).html("<span class='glyphicon glyphicon-heart-empty'></span>");
    }
    $(".btn:eq(2)", $btnGroup).click(function(){
      if($("span", this).attr("class") == 'glyphicon glyphicon-heart-empty name-url'){
        $.ajax({
          url: 'https://api.weibo.com/2/favorites/create.json',
          type: 'post',
          dataType: 'json',
          data: {
            access_token: access_token,
            id: weibo.id
          },
          success: function(data){
            $(".btn:eq(2)", $btnGroup).html("<span class='glyphicon glyphicon-heart'></span>");
            alert("收藏成功");
          }
        });
      } else {
        $.ajax({
          url: 'https://api.weibo.com/2/favorites/destroy.json',
          type: 'post',
          dataType: 'json',
          data: {
            access_token: access_token,
            id: weibo.id
          },
          success: function(data){
            $(".btn:eq(2)", $btnGroup).html("<span class='glyphicon glyphicon-heart-empty'></span>");
            alert("取消收藏成功");
          }
        });
      }
    });
  }
  $wbHandle.append($btnGroup);
  var $wbFunc = $("<div class='wb-func'></div>");
  $wbFunc.append($wbFrom, $wbHandle);
  $wbDetail.append($wbFunc);
  $wbContainer.append($wbFace, $wbDetail);
  return $wbContainer;
}
/**
*判断一条微博文本中用户@，话题#，网址http等各种链接，并添加链接标记
*/
function fParseURL(text){
  var $wbText = $("<div class='wb-text'></div>");
  //http
  var urls = text.match(/http:\/\/\w+\.\w+[\/\w\-]*/ig);
  if(urls != undefined && urls.length !== 0){
    for (var i = 0; i < urls.length; i++) {
      text = text.replace(urls[i], "<a href='"+urls[i]+"' target='_blank'>"+urls[i]+"</a>");
    }
  }
  //#
  var tags = text.match(/#.*?#/ig);
  if(tags != undefined && tags.length !== 0){
    for (var i = 0; i < tags.length; i++) {
      var tag = tags[i].substring(1, tags[i].length-1);
      text = text.replace(tags[i], "<a href='http://huati.weibo.com/k/"+tag+"?from=501&order=time' target='_blank'>"+tags[i]+"</a>");
    }
  }
  //@
  var users = text.match(/@[\w\-\u4E00-\u9FA5\uf900-\ufa2d]*/ig);
  if(users != undefined && users.length !== 0){
    for (var i = 0; i < users.length; i++) {
      var user = users[i].substring(1, users[i].length);
      // text = text.replace(users[i], "<a href='http://weibo.com/n/"+users[i]+"' target='_blank'>"+users[i]+"</a>");
      text = text.replace(users[i], "<a href='#user_timeline' screen_name='"+user+"'>"+users[i]+"</a>");
    }
  }
  //表情符号[呵呵]
  var face = text.match(/[[\w\u4E00-\u9FA5\uf900-\ufa2d]+?]/ig);
  if(face != undefined && face.length !== 0){
    var faces = JSON.parse(storage.getItem("faces"));
    for (var i = 0; i < face.length; i++) {
      for (var j = 0; j < faces.length; j++) {
        if(face[i] == faces[j].value){
          text = text.replace(face[i], "<img src='"+faces[j].icon+"'/>");
          break;
        }
      }
    }
  }
  $wbText.append(text);
  return $wbText;
}
/**
*实时计算剩余可输入字数
**/
function fHintCount($this, total){
  var count = total - $("textarea", $this).val().length;
  console.log(count);
  if(count >= 0){
    if($(".hint", $this).css("color") == "rgb(255, 0, 0)"){
      $(".hint", $this).html("你还可以输入<strong>140</strong>个字").css("color", "grey");
    }
    $(".hint strong", $this).text(count);
  } else {
    $(".hint", $this).html("超过140字数限制").css("color", "red");
  }
}

/*! Copyright (c) 2011 Brandon Aaron (http://brandonaaron.net)
 * Licensed under the MIT License (LICENSE.txt).
 *
 * Thanks to: http://adomas.org/javascript-mouse-wheel/ for some pointers.
 * Thanks to: Mathias Bank(http://www.mathias-bank.de) for a scope bug fix.
 * Thanks to: Seamus Leahy for adding deltaX and deltaY
 *
 * Version: 3.0.6
 * 
 * Requires: 1.2.2+
 */
 
(function($) {
 
var types = ['DOMMouseScroll', 'mousewheel'];
 
if ($.event.fixHooks) {
    for ( var i=types.length; i; ) {
        $.event.fixHooks[ types[--i] ] = $.event.mouseHooks;
    }
}
 
$.event.special.mousewheel = {
    setup: function() {
        if ( this.addEventListener ) {
            for ( var i=types.length; i; ) {
                this.addEventListener( types[--i], handler, false );
            }
        } else {
            this.onmousewheel = handler;
        }
    },
 
    teardown: function() {
        if ( this.removeEventListener ) {
            for ( var i=types.length; i; ) {
                this.removeEventListener( types[--i], handler, false );
            }
        } else {
            this.onmousewheel = null;
        }
    }
};
 
$.fn.extend({
    mousewheel: function(fn) {
        return fn ? this.bind("mousewheel", fn) : this.trigger("mousewheel");
    },
 
    unmousewheel: function(fn) {
        return this.unbind("mousewheel", fn);
    }
});
 
function handler(event) {
    var orgEvent = event || window.event, args = [].slice.call( arguments, 1 ), delta = 0, returnValue = true, deltaX = 0, deltaY = 0;
    event = $.event.fix(orgEvent);
    event.type = "mousewheel";
 
    // Old school scrollwheel delta
    if ( orgEvent.wheelDelta ) { delta = orgEvent.wheelDelta/120; }
    if ( orgEvent.detail     ) { delta = -orgEvent.detail/3; }
 
    // New school multidimensional scroll (touchpads) deltas
    deltaY = delta;
 
    // Gecko
    if ( orgEvent.axis !== undefined && orgEvent.axis === orgEvent.HORIZONTAL_AXIS ) {
        deltaY = 0;
        deltaX = -1*delta;
    }
 
    // Webkit
    if ( orgEvent.wheelDeltaY !== undefined ) { deltaY = orgEvent.wheelDeltaY/120; }
    if ( orgEvent.wheelDeltaX !== undefined ) { deltaX = -1*orgEvent.wheelDeltaX/120; }
 
    // Add event and delta to the front of the arguments
    args.unshift(event, delta, deltaX, deltaY);
 
    return ($.event.dispatch || $.event.handle).apply(this, args);
}
 
})(jQuery);