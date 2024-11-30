dayjs.locale('zh-tw');

//宣告全域變數區
let
  apiPath = './db.json',
  booked = [],
  nationalHoliday = [],
  pallet = {};


//初始化作業
const init = () => {
  fetch('./db.json', { method: 'GET' })
    .then(res => res.json())
    .then(json => {
      // booked = json.booked;
      // pallet = json.pallet;
      // nationalHoliday = json.nationalHoliday;
      ({ booked, pallet, nationalHoliday } = json);
      runCalendarService();
    });
}

const runCalendarService = () => {
  //宣告區，注意這裡變成只有service可以讀到的變數或fn，所以console.log不會印出
  let theDay = dayjs();
  const
    today = dayjs(),
    calLeft = {
      title: 'Left Calendar',
      listBox: '',
      thisDate: theDay,
    },
    calRight = {
      title: 'Right Calendar',
      listBox: '',
      thisDate: theDay.add(1, 'month'),
    },

    listMaker = (obj) => {//調整萬年曆物件，調整完畢後，返回修改後的物件//❓為何這個fn中的obj會知道是calLeft或calRight
      // const firstDay = obj.thisDate.date(1).day();
      const firstDay = obj.thisDate.startOf('month').day();//該月第一天為禮拜幾
      const totalDay = obj.thisDate.daysInMonth();//該月有幾天
      // console.log(firstDay, totalDay);

      //1 = mon, 2 = tue, 3 = wed, 4 = thu, 5 = fri, 6 = sat, 0 = sun
      for (let i = 1; i < (firstDay || 7); i++) {//控制產生多少空白日
        obj.listBox += `<li calss="JsCal"></li>`;
      }

      for (let i = 1; i <= totalDay; i++) {//控制產生多少日期
        obj.listBox += `<li calss="JsCal">${i}</li>`;
      }

      //將月曆的標題代換為目前的月份
      //[方法一]
      // obj.title = `${obj.thisDate.month()+1}月 ${obj.thisDate.year()}年`;

      // [方法二]
      // const monthTostring = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      // obj.title = `${monthTostring[obj.thisDate.month()]} ${obj.thisDate.year()}`;

      // // [方法三]
      const twMonth = window.dayjs_locale_zh_tw.months;
      obj.title = `${twMonth[obj.thisDate.month()]} ${obj.thisDate.year()}`;

      return obj;
    },

    listPrint = () => {//準備輸出到DOM
      // console.log(listMaker(calLeft));
      document.querySelector('.leftDayList').innerHTML = listMaker(calLeft).listBox;
      document.querySelector('.rightDayList').innerHTML = listMaker(calRight).listBox;

      document.querySelector('.leftBar>h4').innerHTML = listMaker(calLeft).title;
      document.querySelector('.rightBar>h4').innerHTML = listMaker(calRight).title;

    }
  listPrint();
};

init();