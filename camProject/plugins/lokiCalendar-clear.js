dayjs.locale('zh-tw');
dayjs.extend(dayjs_plugin_isSameOrBefore);
dayjs.extend(dayjs_plugin_isBetween);

let
  apiPath = './db.json',
  booked = [],
  nationalHoliday = [],
  pallet = {},
  myCalendar = null,
  tableData = {
    totalPrice: 0,
    normalCount: 0,
    holidayCount: 0,
    pallet: {
      aArea: { title: '河畔 × A 區', sellCount: 0, sellInfo: '<div></div>', sumPrice: 0, orderCount: 0 },
      bArea: { title: '山間 × B 區', sellCount: 1, sellInfo: '<div></div>', sumPrice: 0, orderCount: 0 },
      cArea: { title: '平原 × C 區', sellCount: 2, sellInfo: '<div></div>', sumPrice: 0, orderCount: 0 },
      dArea: { title: '車屋 × D 區', sellCount: 3, sellInfo: '<div></div>', sumPrice: 0, orderCount: 0 }
    }
  };

const init = () => {
  fetch('./db.json', { method: 'GET' })
    .then(response => response.json())
    .then(json => {
      ({ booked, pallet, nationalHoliday } = json);
      myCalendar = runCalendarService();
      myCalendar.print();

      document.querySelector('a[href="#nextCtrl"]').onclick = (event) => {
        event.preventDefault();
        myCalendar.add();
      };
      document.querySelector('a[href="#prevCtrl"]').addEventListener('click', (event) => {
        event.preventDefault();
        myCalendar.sub();
      });
      const nodeSelects = document.querySelectorAll('select');

      nodeSelects.forEach(nodeSelect => {
        nodeSelect.onchange = (event) => {
          tableData.totalPrice = 0;
          nodeSelects.forEach(item => {
            tableData.totalPrice += parseInt(item.value) * tableData.pallet[item.name].sumPrice;
            tableData.pallet[item.name].orderCount = parseInt(item.value);
          });

          document.querySelector('#selectPallet h3').textContent = `
        $${tableData.totalPrice} / ${tableData.normalCount}晚平日，${tableData.holidayCount}晚假日
        `;

          document.querySelector('#selectPallet button').disabled = tableData.totalPrice === 0;
        };
      });

      document.querySelector('#selectPallet button').onclick = (event) => {
        const orderOffcanvas = new bootstrap.Offcanvas('.offcanvas');
        const nodeOffcanvas = document.querySelector('#orderForm');
        let liStr = '';

        for (const key in tableData.pallet) {
          if (tableData.pallet[key].orderCount === 0) continue;

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
        nodeOffcanvas.querySelector('.card-header.h5').textcontent = document.querySelector('#selectPallet h3').textContent;
        orderOffcanvas.show();
      };

      document.forms.orderForm.onsubmit = (event) => {
        event.preventDefault();

        const sendData = new FormData(event.target);

        const selectDate = [...document.querySelectorAll('li.selectHead, li.selectConnect')].map(i => i.dataset.date);
        sendData.append('selectDate', JSON.stringify(selectDate));

        const sellOut = {};
        Object.keys(tableData.pallet).forEach(key => {
          sellOut[key] = tableData.pallet[key].orderCount;
        });
        sendData.append('selectDate', JSON.stringify(sellOut));

        if (!event.target.checkValidity()) event.target.classList.add('was-validated');
        else {
          fetch('https://jsonplaceholder.typicode.com/posts', {
            method: 'POST',
            body: sendData,
          }).then(response => response.json())
            .then(res => {
              if (res.id) {
                alert('您的訂單已送出，訂單編號為' + res.id);
                document.location.reload();
              };
            });
        };
      };

      myCalendar.tableRefresh();
    });
}

const runCalendarService = () => {
  let theDay = dayjs();
  let
    calLeft = {
      title: '',
      listBox: '',
      thisDate: theDay,
    },
    calRight = {
      title: '',
      listBox: '',
      thisDate: theDay.add(1, 'month'),
    };
  const
    today = dayjs(),
    userChooseDays = [null, null],
    InitTableDataStr = JSON.stringify(tableData),
    changeMonth = (num) => {
      theDay = theDay.add(num, 'month');

      calLeft = {
        title: '',
        listBox: '',
        thisDate: theDay,
      };
      calRight = {
        title: '',
        listBox: '',
        thisDate: theDay.add(1, 'month'),
      };
    },
    chooseList = (node) => {
      if (!userChooseDays[0] && !userChooseDays[1]) {
        node.classList.add('selectHead');
        userChooseDays[0] = node;
      } else if (userChooseDays[0] && !userChooseDays[1]) {
        node.classList.add('selectFoot');
        userChooseDays[1] = node;

        const sec2fst = dayjs(userChooseDays[1].dataset.date).isSameOrBefore(userChooseDays[0].dataset.date);
        if (sec2fst) {
          userChooseDays[0].classList.replace('selectHead', 'selectFoot');
          userChooseDays[1].classList.replace('selectFoot', 'selectHead');

          [userChooseDays[0], userChooseDays[1]] = [userChooseDays[1], userChooseDays[0]];
        }
        document.querySelectorAll('li.selectDay').forEach(item => {
          const isBetween = dayjs(item.dataset.date).isBetween(
            userChooseDays[0].dataset.date,
            userChooseDays[1].dataset.date
          );

          if (isBetween) item.classList.add('selectConnect');
        });

        tableMaker();

      } else {
        userChooseDays[0].classList.remove('selectHead');
        node.classList.add('selectHead');
        userChooseDays[0] = node;

        userChooseDays[1].classList.remove('selectFoot');
        userChooseDays[1] = null;

        document.querySelectorAll('li.selectConnect').forEach(item => item.classList.remove('selectConnect'));
      }
    },
    listMaker = (obj) => {
      const firstDay = obj.thisDate.startOf('month').day();
      const totalDay = obj.thisDate.daysInMonth();

      for (let i = 1; i < (firstDay || 7); i++) {
        obj.listBox += `<li calss="JsCal"></li>`;
      }

      for (let i = 1; i <= totalDay; i++) {
        let classStr = 'JsCal';
        const tempDay = obj.thisDate.date(i);
        const tempDayStr = tempDay.format('YYYY-MM-DD');
        if (tempDay.isSameOrBefore(today)) classStr += ' delDay';
        else {
          const isNationalHoliday = nationalHoliday.includes(tempDayStr);
          if (((firstDay + i) % 7 < 2) || isNationalHoliday) classStr += ' holiday';

          const checkBookObject = booked.find((bookObj) => bookObj.date === tempDayStr);

          if (
            checkBookObject &&
            (pallet.count === Object.values(checkBookObject.sellout).reduce((prv, cur) => prv + cur, 0))
          ) classStr += ' fullDay';

          classStr += ' selectDay';
        }
        obj.listBox += `<li class="${classStr}" data-date="${tempDayStr}">${i}</li>`;
      }

      const twMonth = window.dayjs_locale_zh_tw.months;
      obj.title = `${twMonth[obj.thisDate.month()]} ${obj.thisDate.year()}`;

      return obj;
    },
    listPrint = () => {
      const newCalLeft = listMaker(calLeft);
      listMaker(calRight);

      document.querySelector('.leftDayList').innerHTML = newCalLeft.listBox;
      document.querySelector('.rightDayList').innerHTML = calRight.listBox;

      document.querySelector('.leftBar>h4').innerHTML = newCalLeft.title;
      document.querySelector('.rightBar>h4').innerHTML = calRight.title;

      document.querySelectorAll('.selectDay').forEach((item) => {
        item.onclick = () => myCalendar.choose(item);
      });
    },
    tableMaker = () => {
      tableData = JSON.parse(InitTableDataStr);

      for (const key in tableData.pallet) {
        tableData.pallet[key].sellCount = pallet[key].total;
      }
      document.querySelectorAll('li.selectHead, li.selectConnect').forEach(nodeLi => {
        for (const key in tableData.pallet) {
          const hasOrder = booked.find(bookItem => {
            return bookItem.date === nodeLi.dataset.date;
          });

          if (hasOrder) {
            tableData.pallet[key].sellCount = Math.min(tableData.pallet[key].sellCount, pallet[key].total - hasOrder.sellout[key]);
          };

          if (tableData.pallet[key].sellCount) {
            const dayPrice = pallet[key][nodeLi.classList.contains('holiday') ? 'holidayPrice' : 'normalPrice'];
            tableData.pallet[key].sellInfo += `<div>${nodeLi.dataset.date} (${dayPrice})</div>`;
            tableData.pallet[key].sumPrice += dayPrice;
          } else {
            tableData.pallet[key].sellInfo = `<div>已售完</div>`;
            tableData.pallet[key].sumPrice = 0;
          };
        }
        tableData[nodeLi.classList.contains('holiday') ? 'holidayCount' : 'normalCount']++
      });
      tablePrint();
    },
    tablePrint = () => {
      document.querySelectorAll('#selectPallet select').forEach((nodeSelect) => {
        const palletName = nodeSelect.name;

        const countOption = tableData.pallet[palletName].sellCount

        let optStr = '';
        for (let i = 0; i <= 5; i++) {
          optStr += `<option value="${i}">${i}</option>`;
        };

        nodeSelect.innerHTML = optStr;
        nodeSelect.disabled = countOption === 0;

        const tdSellInfo = nodeSelect.parentElement.previousElementSibling;
        tdSellInfo.innerHTML = tableData.pallet[palletName].sellInfo;

        const tdRemain = tdSellInfo.previousElementSibling.querySelector('span');
        tdRemain.textContent = countOption;

        document.querySelector('#selectPallet h3').textContent = `
        $${tableData.totalPrice} / ${tableData.normalCount}晚平日，${tableData.holidayCount}晚假日
        `;
      });
    }
    
  return {
    print: () => listPrint(),
    add: () => { changeMonth(1); listPrint(); },
    sub: () => { changeMonth(-1); listPrint(); },
    choose: item => {
      if (item.classList.contains('selectHead') && !userChooseDays[1]) return;
      chooseList(item);
    }, 
    tableRefresh: () => tablePrint()
  };
};

init();