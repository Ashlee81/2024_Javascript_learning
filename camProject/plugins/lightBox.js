!function () {//使用IIFE防止汙染全域變數
  //初始宣告變數區
  const init = () => {
    const lightBoxNode = document.querySelector('#lightBox');
    const mainZoneNode = lightBoxNode.querySelector('.mainZone');
    const controlNode = lightBoxNode.querySelector('.control');

    //col為每個圖片的主題
    document.querySelectorAll('#lokiPark .col').forEach((colNode) => {
      //找小圖並複製成為新node，然後塞到燈箱control區
      const newMinImgNode = colNode.querySelector('img').cloneNode();//將節點再複製一份
      newMinImgNode.dataset.label = colNode.querySelector('h5').textContent;//設置一個新的html屬性，並將圖片的文字放進其中
      //順便幫minImg綁click
      newMinImgNode.addEventListener('click', (e) => {
        mainZoneNode.querySelector('img').src = newMinImgNode.src;
        mainZoneNode.querySelector('p').textContent = newMinImgNode.dataset.label;
      });



      controlNode.append(newMinImgNode);

      //規劃每個col事件 click，打開燈箱
      colNode.addEventListener('click', () => {
        //偷換好主圖和文字後，再打開燈箱

        //[方法1]想辦法把當下col內的img跟string傳到mainZoneNode替換
        // mainZoneNode.querySelector('img').src = colNode.querySelector('img').src;
        // mainZoneNode.querySelector('p').textContent = colNode.querySelector('h5').textContent;

        //[方法2]把minImgNode的click事件觸發
        newMinImgNode.click();


        //打開燈箱
        lightBoxNode.classList.add('active');
      });
    });

    //燈箱的黑色背景指定click 對自己做關閉
    //[方法1]
    // lightBoxNode.querySelector('.backdrop').addEventListener('click', () => {
    //   lightBoxNode.classList.remove('active');
    // });

    //[方法2]
    // lightBoxNode.querySelector('.backdrop').addEventListener('click', () => {
    //   e.target.parentNode.classList.remove('active');
    // });

    //[方法3]
    lightBoxNode.querySelector('.backdrop').addEventListener('click', function () {
      this.parentNode.classList.remove('active');
    });

    //-----------------------------------------------------------


  };




  //初始化執行
  init();
}();