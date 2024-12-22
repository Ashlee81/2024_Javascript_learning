//[範例]可直接立即呼叫這個匿名函式的表達式
//為了產生區間變數並執行，可以使用IIFE
// (function () {
//   const loki = 'A';
//   console.log(`${loki}++`);
// })();

!function () {//另一種寫法
  const loki = 'A';
  console.log(`${loki}++`);
}();