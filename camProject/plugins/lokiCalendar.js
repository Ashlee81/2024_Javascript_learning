dayjs.locale('zh-tw');
dayjs.extend(dayjs_plugin_isSameOrBefore);
dayjs.extend(dayjs_plugin_isBetween);

//宣告全域變數區
let
  apiPath = './db.json',
  booked = [],
  nationalHoliday = [],
  pallet = {},
  myCalendar = null,
  tableData = {
    totalPrice: 0,//初始的表格資料
    normalCount: 0,//平日幾晚
    holidayCount: 0,//假日幾晚
    pallet: {//營位資料 => 標題名稱、可賣數量、預約日金、小計、訂購數
      aArea: { title: '河畔 × A 區', sellCount: 0, sellInfo: '<div></div>', sumPrice: 0, orderCount: 0 },
      bArea: { title: '山間 × B 區', sellCount: 1, sellInfo: '<div></div>', sumPrice: 0, orderCount: 0 },
      cArea: { title: '平原 × C 區', sellCount: 2, sellInfo: '<div></div>', sumPrice: 0, orderCount: 0 },
      dArea: { title: '車屋 × D 區', sellCount: 3, sellInfo: '<div></div>', sumPrice: 0, orderCount: 0 }
    }
  };


//初始化作業
const init = () => {
  //安排工作api
  fetch('./db.json', { method: 'GET' })
    .then(response => response.json())
    .then(json => {
      // booked = json.booked;
      // pallet = json.pallet;
      // nationalHoliday = json.nationalHoliday;
      ({ booked, pallet, nationalHoliday } = json);

      myCalendar = runCalendarService();//[閉包觀念]創造一個服務原生函式，他提供一個method，像是print,add,sub
      myCalendar.print();//對此原生函式調用print，產生DOM

      //規劃DOM事件
      document.querySelector('a[href="#nextCtrl"]').onclick = (event) => {//差，用HTML屬性click來綁定JS函式
        event.preventDefault();//取消預設行為
        myCalendar.add();
      };
      document.querySelector('a[href="#prevCtrl"]').addEventListener('click', (event) => {//優，用JS來規劃event
        event.preventDefault();//取消預設行為
        myCalendar.sub();
      });
      const nodeSelects = document.querySelectorAll('select');//四個下拉選單

      nodeSelects.forEach(nodeSelect => {//每個下拉選單個別發生事件時，都要從0計算總價
        nodeSelect.onchange = (event) => {
          tableData.totalPrice = 0;
          nodeSelects.forEach(item => {//總價就是 當下畫面的四組相加(下拉數量*小計 sumPrice)
            tableData.totalPrice += parseInt(item.value) * tableData.pallet[item.name].sumPrice;

            //更新tableData的四組orderCount，方便下一步驟可以直接獲取當下的選擇情況(不用再DOM去找select value)。
            tableData.pallet[item.name].orderCount = parseInt(item.value);
          });

          //要更新畫面上的總價格，但不需要整個tablePrint(會大更新)，只須更新html上的小數字就好
          document.querySelector('#selectPallet h3').textContent = `
        $${tableData.totalPrice} / ${tableData.normalCount}晚平日，${tableData.holidayCount}晚假日
        `;

          //如果訂單為0元，就鎖住按鈕❗❗❗按鈕沒有鎖成功
          document.querySelector('#selectPallet button').disabled = tableData.totalPrice === 0;
        };
      });

      document.querySelector('#selectPallet button').onclick = (event) => {//點擊提交訂單的按鈕
        //將tableData整理到彈窗(html)上，藉由呼喊orderOffcanvas出現
        const orderOffcanvas = new bootstrap.Offcanvas('.offcanvas');//左側彈窗
        const nodeOffcanvas = document.querySelector('#orderForm');//左側彈窗的html
        let liStr = '';

        //將tableData四組資料跑出來
        for (const key in tableData.pallet) {
          if (tableData.pallet[key].orderCount === 0) continue;

          //如果走到這，代表有選擇1以上，接著整合到liStr
          liStr += `
            <li class="list-group-item d-flex justify-content-between align-items-start">
              <div class="ms-2 me-auto">
                <div class="fw-bold">${tableData.pallet[key].title}</div>
                <div>
                  ${tableData.pallet[key].sellInfo}
                </div>
              </div>
              <span class="badge bg-warning rounded-pill">x <span class="fs-6">${tableData.pallet[key].orderCount}</span>帳</span>
            </li>
          `;
        };
        nodeOffcanvas.querySelector('ol').innerHTML = liStr;
        nodeOffcanvas.querySelector('.card-header.h5').textcontent = document.querySelector('#selectPallet h3').textContent;//❗❗彈窗的文字沒有換成功
        orderOffcanvas.show();
      };

      //offcanvas提交訂單的事件
      // document.querySelector('#orderForm').onsubmit = (event) => {
      document.forms.orderForm.onsubmit = (event) => {//❓.onsubmit是什麼?
        event.preventDefault();//阻擋html from遇到submit會發生指向aciton動作，這時候要阻擋預設行為

        //1. 客製化表單資料，除了原本的form 3組，多手動加2組
        const sendData = new FormData(event.target);

        //手動兩個表單欄位，擴增到sendData，就不需要在html上面做隱藏欄位
        // const selectDate = ["2024-12-11","2024-12-12"];
        const selectDate = [...document.querySelectorAll('li.selectHead, li.selectConnect')].map(i => i.dataset.date);//將node解構後轉換為真正的陣列
        sendData.append('selectDate', JSON.stringify(selectDate));

        //ex: const sellOut = {'aArea':2, 'bArea':2, 'cArea':0, 'dArea':4};//目標產生這樣的JSON字串塞入FormData
        const sellOut = {};//初始空陣列，慢慢塞回來
        // ['aArea', 'bArea', 'cArea', 'dArea'].forEach(key => {
        Object.keys(tableData.pallet).forEach(key => {
          sellOut[key] = tableData.pallet[key].orderCount;
        });
        sendData.append('selectDate', JSON.stringify(sellOut));

        //檢查用
        // for (const [key, value] of sendData) {
        //   console.log(key, value);
        // };

        //2.驗證表單有效性
        if (!event.target.checkValidity()) event.target.classList.add('was-validated')//使用bootstap的驗證功能
        else {
          //3.送出表單
          fetch('https://jsonplaceholder.typicode.com/posts', {
            method: 'POST',
            body: sendData,
            // headers:{'Content-Type': 'multipart/form-data'}
          }).then(response => response.json())
            .then(res => {
              if (res.id) {
                alert('您的訂單已送出，訂單編號為' + res.id);
                document.location.reload();
              };
            });
        };
      };



      myCalendar.tableRefresh();//網頁載入的第一次tablePrint
    });

}

const runCalendarService = () => {
  //宣告區，注意這裡變成只有service可以讀到的變數或fn，所以console.log不會印出
  let theDay = dayjs();//今天的時間物件，透過第三方套件獲取
  let
    calLeft = {
      title: '',
      listBox: '',
      thisDate: theDay,//今天的時間，當作當月的代表日（time object）
    },
    calRight = {
      title: '',
      listBox: '',
      thisDate: theDay.add(1, 'month'),//下個月，當作下個月的代表日（time object）
    };
  const
    today = dayjs(),
    userChooseDays = [null, null],
    InitTableDataStr = JSON.stringify(tableData),//轉為普通字串，脫離物件導向觀念
    changeMonth = (num) => {//先歸零，重新計算該有的title跟listBox
      theDay = theDay.add(num, 'month');

      calLeft = {
        title: '',
        listBox: '',
        thisDate: theDay,//改變該月份代表日
      };
      calRight = {
        title: '',
        listBox: '',
        thisDate: theDay.add(1, 'month'),//改變下個月份代表日
      };
    },
    chooseList = (node) => {//負責將現有的DOM規劃selectHead selectFoot selectConnect
      // console.log(node.dataset.date);

      if (!userChooseDays[0] && !userChooseDays[1]) {//[情況一]:[null,null]
        node.classList.add('selectHead');
        userChooseDays[0] = node;
      } else if (userChooseDays[0] && !userChooseDays[1]) {//[情況二]:[1st,null]
        node.classList.add('selectFoot');
        userChooseDays[1] = node;//[1st,2nd]

        //dayjs('2024-12-18').isSameOrBefore('2024-12-21') === true;
        const sec2fst = dayjs(userChooseDays[1].dataset.date).isSameOrBefore(userChooseDays[0].dataset.date);
        if (sec2fst) {
          userChooseDays[0].classList.replace('selectHead', 'selectFoot');
          userChooseDays[1].classList.replace('selectFoot', 'selectHead');

          [userChooseDays[0], userChooseDays[1]] = [userChooseDays[1], userChooseDays[0]];
        }
        //補上selectConnect，找到介於這兩天之內的日期
        document.querySelectorAll('li.selectDay').forEach(item => {
          //dayjs("2024-12-20").isBetween("2024-12-01","2024-12-31") === true
          const isBetween = dayjs(item.dataset.date).isBetween(
            userChooseDays[0].dataset.date,
            userChooseDays[1].dataset.date
          );

          if (isBetween) item.classList.add('selectConnect');
        });

        tableMaker();//user都好了，執行tableMaker

      } else {//[情況三]:[1st,2nd]

        userChooseDays[0].classList.remove('selectHead');//取消原本視覺的head
        node.classList.add('selectHead');
        userChooseDays[0] = node;//[1st,null]

        userChooseDays[1].classList.remove('selectFoot');//取消原本視覺的foot
        userChooseDays[1] = null; //[null,null]

        //取消原本的 seletConnect
        document.querySelectorAll('li.selectConnect').forEach(item => item.classList.remove('selectConnect'));
      }

    },

    listMaker = (obj) => {//調整萬年曆物件，調整完畢後，返回修改後的物件//❓為何這個fn中的obj會知道是calLeft或calRight
      // console.log(obj);
      // const firstDay = obj.thisDate.date(1).day();
      const firstDay = obj.thisDate.startOf('month').day();//該月第一天為禮拜幾
      const totalDay = obj.thisDate.daysInMonth();//該月有幾天
      // console.log(firstDay, totalDay);

      //1 = mon, 2 = tue, 3 = wed, 4 = thu, 5 = fri, 6 = sat, 0 = sun
      for (let i = 1; i < (firstDay || 7); i++) {//控制產生多少空白日
        obj.listBox += `<li calss="JsCal"></li>`;
      }

      for (let i = 1; i <= totalDay; i++) {//控制產生多少日期
        let classStr = 'JsCal';//將class獨立為一個變數，可對其追加class name

        //過期判定
        const tempDay = obj.thisDate.date(i);//每次回圈得數字轉換為當月指定日的time object。dayjs中的date()等同於setDate()，也就是指定'日期'。
        const tempDayStr = tempDay.format('YYYY-MM-DD');//.format()可以把time object轉成字串
        // console.log(tempDayStr);
        if (tempDay.isSameOrBefore(today)) classStr += ' delDay';//透過isSameOrBefore,該日期跟今日比較，符合相同日或早於為true，代表過期
        else {//沒過期再追加以下的class name
          //假日判定
          const isNationalHoliday = nationalHoliday.includes(tempDayStr);
          if (((firstDay + i) % 7 < 2) || isNationalHoliday) classStr += ' holiday';

          //滿帳，訂滿的日期。某次迴圈下，目前為2024-12-02，透過booked find比對是否找到booked date跟2024-12-02一樣
          const checkBookObject = booked.find((bookObj) => bookObj.date === tempDayStr);//找到就吐回來，沒有就undefined

          if (
            checkBookObject//當天有出現在booked裡面
            &&
            (pallet.count === Object.values(checkBookObject.sellout).reduce((prv, cur) => prv + cur, 0))//總和等於總售出，如結果為0，代表已售完
          ) classStr += ' fullDay';

          //可以選擇的日子select Day

          classStr += ' selectDay';
        }
        obj.listBox += `<li class="${classStr}" data-date="${tempDayStr}">${i}</li>`;
      }

      //將月曆的標題代換為目前的月份
      //[方法一]
      // obj.title = `${obj.thisDate.month()+1}月 ${obj.thisDate.year()}年`;

      // [方法二]
      // const monthTostring = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      // obj.title = `${monthTostring[obj.thisDate.month()]} ${obj.thisDate.year()}`;

      //[方法三]
      const twMonth = window.dayjs_locale_zh_tw.months;//使用dayjs套件
      obj.title = `${twMonth[obj.thisDate.month()]} ${obj.thisDate.year()}`;

      return obj;
    },

    listPrint = () => {//準備輸出到DOM
      // console.log(listMaker(calLeft));
      const newCalLeft = listMaker(calLeft);//把乾淨的calc物件丟進去得到更新後的calc物件
      listMaker(calRight);//也可以不使用return obj來操作DOM，因為listMaker直接修改指定物件內容，所以原本的物件就被更新，也可以直接用原本obj變數來操作DOM

      document.querySelector('.leftDayList').innerHTML = newCalLeft.listBox;
      document.querySelector('.rightDayList').innerHTML = calRight.listBox;

      document.querySelector('.leftBar>h4').innerHTML = newCalLeft.title;
      document.querySelector('.rightBar>h4').innerHTML = calRight.title;

      //畫面都更新後，考慮這些持有selectDay的日子，具備event可以選擇
      document.querySelectorAll('.selectDay').forEach((item) => {
        item.onclick = () => myCalendar.choose(item);
      });
    },
    tableMaker = () => {//整理tableData
      //負責翻新全域變數的tableData
      tableData = JSON.parse(InitTableDataStr);//利用字串轉物件，會產生一個新的物件，跟原本物件不會互相影響

      for (const key in tableData.pallet) {//獲得四組pallet名字，方便對tableData修訂內容//🔍forin要複習
        //1. 修正sellcount，先總數，再根據數量一個個減少
        tableData.pallet[key].sellCount = pallet[key].total;
      }

      //2.去得知user選的頭尾日期
      document.querySelectorAll('li.selectHead, li.selectConnect').forEach(nodeLi => {
        // console.log(nodeLi.dataset.date);
        for (const key in tableData.pallet) {//獲取四個pallet名稱
          const hasOrder = booked.find(bookItem => {
            return bookItem.date === nodeLi.dataset.date;
          });

          //2-1. 如果有找到當日的訂單，更新剩餘的房間數量
          if (hasOrder) {
            // y再連續天數的訂單，可以賣的房數必須是'剩餘房數的最小值'
            tableData.pallet[key].sellCount = Math.min(tableData.pallet[key].sellCount, pallet[key].total - hasOrder.sellout[key]);
          };

          //2-2 如果房況有剩，顯示該key的sellInfo販售資訊(日期/每帳價格)
          if (tableData.pallet[key].sellCount) {
            // [寫法一]const dayPrice = nodeLi.classList.contains('holiday') ? pallet[key].holidayPrice : pallet[key].normalPrice;
            // [寫法二]
            const dayPrice = pallet[key][nodeLi.classList.contains('holiday') ? 'holidayPrice' : 'normalPrice'];
            // console.log(nodeLi.dataset.date, dayPrice);
            tableData.pallet[key].sellInfo += `<div>${nodeLi.dataset.date} (${dayPrice})</div>`;
            tableData.pallet[key].sumPrice += dayPrice;
          } else {
            tableData.pallet[key].sellInfo = `<div>已售完</div>`;
            tableData.pallet[key].sumPrice = 0;
          };
        }
        //2-3.根據user選的日期，判斷有沒有class holiday，疊加假日或平日數量
        // nodeLi.classList.contains('holiday') ? tableData.holidayCount++ : tableData.normalCount++;
        tableData[nodeLi.classList.contains('holiday') ? 'holidayCount' : 'normalCount']++
      });
      tablePrint();//❗❗沒抄完
    },
    tablePrint = () => {//tableData做成HTML
      // console.log('開始渲染表格');
      document.querySelectorAll('#selectPallet select').forEach((nodeSelect) => {
        const palletName = nodeSelect.name;

        const countOption = tableData.pallet[palletName].sellCount

        let optStr = '';
        for (let i = 0; i <= 5; i++) {
          optStr += `<option value="${i}">${i}</option>`;
        };

        nodeSelect.innerHTML = optStr;
        // if (countOption === 0) nodeSelect.disabled = true;
        nodeSelect.disabled = countOption === 0;//針對count為0，直接select為disabled

        //select < td ~ td(sellInfo位置)
        const tdSellInfo = nodeSelect.parentElement.previousElementSibling;
        tdSellInfo.innerHTML = tableData.pallet[palletName].sellInfo;

        //td(selectInfo) ~ td > label > span
        const tdRemain = tdSellInfo.previousElementSibling.querySelector('span');
        tdRemain.textContent = countOption;

        //
        document.querySelector('#selectPallet h3').textContent = `
        $${tableData.totalPrice} / ${tableData.normalCount}晚平日，${tableData.holidayCount}晚假日
        `;
        // console.log(palletName);
      });
    }

  // listPrint();
  return {
    print: () => listPrint(),//外面的人可以控制service何時才要輸出萬年曆
    add: () => {
      changeMonth(1);
      listPrint();//再輸出一次
    },
    sub: () => {
      changeMonth(-1);
      listPrint();//再輸出一次
    },
    choose: item => {
      //如果在某個詭異情況(head foot為同一天)，忽略這次的動作
      //詭異情況=> item.classList持有selectHead，以及當下的2nd還沒有選擇
      // console.log(item);
      if (item.classList.contains('selectHead') && !userChooseDays[1]) return;
      chooseList(item);

      //不在這個詭異情況可以做
      // if (!true) chooseList(item);
    },
    tableRefresh: () => tablePrint()
  };
};

init();