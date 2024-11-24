//宣告全域變數，讓整個JS都可以讀取到
const btnStart = document.querySelector('button');//遊戲開始按鈕
const timeNode = document.querySelector('#time');//60秒倒數
const countNode = document.querySelector('#combo');//遊戲分數
const animals = document.querySelectorAll('img');//狗狗圖片

let time = 60, count = 0;
const redToYellow = [];

//規劃功能函式
const gameStart = () => {
  //step1:一旦按下開始鍵，就讓btnStart失去作用，沒有click事件也有
  btnStart.removeEventListener('click', gameStart);
  btnStart.disabled = true;//[方法一]

  //step2:校正歸零
  time = 60;
  count = 0;
  timeNode.textContent = time;
  countNode.textContent = count;

  //step3:開始計時
  const timer = setInterval(() => {
    time--;
    timeNode.textContent = time;

    if (time === 0) {
      clearInterval(timer);
      //讓btnStart恢復，可以再玩
      btnStart.addEventListener('click', gameStart);
      btnStart.disabled = false;
    }
  }, 1000);


  //step4:產生100個red事件，然後指定到9宮格內某個state.png空閒位置，包含出現時間點及曝光多久。
  for (let i = 0; i < 100; i++) {
    // const atSpace = Math.floor(Math.random() * 9);//指定格子0~8
    // const atTime = Math.floor(Math.random() * 56000);//總遊戲時間0 ~ 56 sec => rand 0 ~ 55999 毫秒
    // const atShow = Math.floor(Math.random() * 3) + 2;//停留時間2 ~ 4 秒 => rand 0 ~ 2+2
    const showObj = {//🔴需再複習'物件'單元
      space: Math.floor(Math.random() * 9),//指定格子0~8
      show: Math.floor(Math.random() * 3) + 2,//停留時間2 ~ 4 秒 => rand 0 ~ 2+2
      id: i
    }
    //在單一red事件下，試圖觸發到畫面上，每一個都要延遲觸發atTime
    setTimeout(() => {
      //showIt(atSpace,i, atTime, atShow);
      showIt({ showObj });//showIt({ showObj });
    }, Math.floor(Math.random() * 56000));
  };

};
//🚫🚫🚫有地方寫錯

const showIt = (obj) => { //負責將紅色顯示在畫面上

  /*step1:試圖找到指定的圖片，替換為red，並控制幾秒後消失返回yellow，
    如果當下space已是紅色不要覆蓋，想辦法重新安排其他位置出場
  */

  if (animals[obj.space].classList.length > 0) {
    // 因為有class，所以不是黃色代表正在執行某個任務，所以得改個位置
    obj.space = Math.floor(Math.random() * 9);//再重新決定0~8

    /*❗❗❗如果畫面都是red，大家都找不到空間，大家都馬上去找新位置，
      當下會發生無限迴圈不斷找新位置，會導致電腦效能變差
      解方：稍微空窗0.1秒，不要這麼頻繁的馬上找。
    */
    setTimeout(() => {
      showIt(obj);
    }, 100);
    return;

  } else {
    animals[obj.space].classList.add('red');
    animals[obj.space].src = 'img/on.png';
    animals[obj.space].dataset.playerId = obj.id;//自定義HTML新的屬性

    //記下當時timeout的定時器id，利於某時機可以清除
    redToYellow[obj.id] = setTimeout(() => {//回傳定時器的序號，把它當作value存入
      animals[obj.space].classList.remove('red');
      animals[obj.space].src = 'img/state.png';
      delete animals[obj.space].dataset.playerId;
    }, obj.show * 1000);
  }
};

const getCombo = (space) => {
  if (animals[space].classList.contains('red')) {
    //如果是red，計分+1，並讓red變成green
    count++;
    countNode.textContent = count;

    animals[space].classList.remove('red');
    animals[space].classList.add('green');
    animals[space].src = 'img/off.png';

    //因為計分red to green了，原本的red to yellow的定時器要清除
    // console.log(animals[space].dataset.playerId);
    // const playerId = animals[space].dataset.playerId;
    // const bombSN=redToYellow[playerId];
    // clearTimeout(bombSN);
    clearTimeout(redToYellow[animals[space].dataset.playerId]);

    setTimeout(() => {
      animals[space].classList.remove('green');
      animals[space].src = 'img/state.png';
    }, 1000);
  };
};


//初始執行區域
btnStart.addEventListener('click', gameStart);
document.onkeydown = function (event) {
  console.log(event.keyCode);
  switch (event.keyCode) {
    case 103: getCombo(0); break;
    case 104: getCombo(1); break;
    case 105: getCombo(2); break;
    case 100: getCombo(3); break;
    case 101: getCombo(4); break;
    case 102: getCombo(5); break;
    case 97: getCombo(6); break;
    case 98: getCombo(7); break;
    case 99: getCombo(8); break;
  }
}

animals.forEach((animal, index) => {
  animal.addEventListener('click', () => {
    getCombo(index);
  });
});