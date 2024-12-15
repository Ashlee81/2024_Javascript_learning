onload = () => {
  var grid = document.querySelector('#lokiPark article.row');
  var msnry = new Masonry(grid, { percentPosition: 'true' });
  //設定cookie

  //1.取得cookieAry,ary value ex: cookieUse = agree
  const
    aryCookie = document.cookie.split('; '),
    nodeCookie = document.querySelector('#lokiCookie'),
    keywordCookie = 'cookieUsed-agree';

  //2.檢查cookieAry是否有關鍵字
  if (aryCookie.includes(keywordCookie)) {
    //已同意
    nodeCookie.remove();
  } else {
    //還沒同意
    nodeCookie.style.display = 'block';//顯示提示

    nodeCookie.querySelector('button').onclick = () => {//規劃按鈕事件
      //設定cookie
      //[方法一]沒指定
      // document.cookie = keywordCookie;

      // [方法二]指定何時到期
      // now=new Date();
      // now.setTime(now.getTime() + 24 * 60 * 60 * 1000);
      // document.cookie = `${keywordCookie};expires='${now.toUTCString()}'`;
      
      // [方法三]指定活多久
      document.cookie =`${keywordCookie};max-age=${24*60*60*1000}`;
      nodeCookie.remove();
    };
  };
}