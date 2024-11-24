//宣告全域變數，讓整個JS都可以讀取到
const btnStart = document.querySelector('button');//遊戲開始按鈕
const timeNode = document.querySelector('#time');//60秒倒數
const scoreNode = document.querySelector('#score');//得到的分數
const dogs = document.querySelectorAll('img');//狗狗的圖

let time = 60, score = 0


//規劃功能函式
const gameStart = () => {
  //[step1]一旦按下遊戲開始，就讓btnStart失去作用
  btnStart.removeEventListener('click', gameStart);
  btnStart.disabled = true;//利用button裡的disabled屬性(HTML)

  //[step2]校正歸零
  time = 60;
  count = 0;
  timeNode.innerHTML = time;
  scoreNode.innerHTML = score;

  //[step3]開始計時
  const timer = setInterval(() => {
    time--;//時間開始倒數
    timeNode.innerHTML = time;

    if (time === 0) {
      clearInterval(timer);
      //讓btnStart恢復，可以再玩
      btnStart.addEventListener('click', gameStart);
      btnStart.disabled = false;
    }
  }, 1000);

  /*[step4]產生100個red事件，然後指定到9宮格內某個state.png空閒位置，
  包含出現的時間點以及曝光多久*/
  for (let i = 0; i < 100; i++) {
    // const atSpace = Math.floor(Math.random() * 9);//指定格子0~8
    // const atTime = Math.floor(Math.random() * 56000);//總遊戲時間0 ~ 56 sec => rand 0 ~ 55999 毫秒
    // const showTime = Math.floor(Math.random() * 3) + 2;//曝光時間2 ~ 4 sec => (0~2)+2
    const showObj = {
      space: Math.floor(Math.random() * 9),//指定格子0~8
      show: Math.floor(Math.random() * 3) + 2,//曝光時間2 ~ 4 sec => (0~2)+2
      id: i
    }

    //[step4-1]在單一red事件下，試圖觸發到畫面上，每一個都要延遲觸發atTime
    setTimeout(() => {
      showIt(showObj);
    }, Math.floor(Math.random() * 56000));
  }
};

const showIt = (obj) => {
  // console.log(obj);
  /*
  * [step1]找到指定得圖片，替換為red，並控制幾秒後消失返回yellow
  * 如果當下space已是紅色不要覆蓋，想辦法重新安排其他位置出場
  */
  if (dogs[obj.space].classList.length > 0) {
    // 因為有class，只要不是黃色代表正在執行某個任務，所以得改個位置
    obj.space = Math.floor(Math.random() * 9);//再重新決定0~8

    /*[step2]如果畫面都是red，大家都找不到空間，大家都馬上去找新位置，
    * 當下會發生無限迴圈不斷找新位置，會導致電腦效能變差
    * 解方：稍微空窗0.1秒，不要這麼頻繁的馬上找。
    */
    setTimeout(() => {
      showIt(obj);
    }, 100);
    return;

  } else {
    dogs[obj.space].classList.add('red');
    dogs[obj.space].src = 'img/on.png';
    setTimeout(() => {
      dogs[obj.space].classList.remove('red');
      dogs[obj.space].src = 'img/state.png';
    }, obj.show * 1000);
  };
}

const getScore = (space) => {
  if (dogs[space].classList.contains('red')) {
    //如果是red，計分+1，並讓red to green
    scoreNode.textContent = ++score;

    dogs[space].classList.remove('red');
    dogs[space].classList.add('green');
    dogs[space].src = 'img/off.png';

    setTimeout(() => {
      dogs[space].classList.remove('green');
      dogs[space].src = 'img/state.png';
    }, 1000);
  };
}


//初始執行區域
btnStart.addEventListener('click', gameStart)//❓為什麼會說這邊不適合用箭頭函式?
document.onkeydown = function (event) {//如果想鎖多個鍵盤事件,可以用陣列寫
  console.log(event.keyCode);
  switch (event.keyCode) {
    case 103: getScore(0); break;
    case 104: getScore(1); break;
    case 105: getScore(2); break;
    case 100: getScore(3); break;
    case 101: getScore(4); break;
    case 102: getScore(5); break;
    case 97: getScore(6); break;
    case 98: getScore(7); break;
    case 99: getScore(8); break;
  };
}
