// 1桁の数字を0埋めで2桁にする
const toDoubleDigits = (num) => {
  num += "";
  if (num.length === 1) {
    num = "0" + num;
  }
  return num;
};

// 日付をYYYY/MM/DD HH:DD:MI:SS形式で取得
const yyyymmddhhmiss = () => {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = toDoubleDigits(date.getMonth() + 1);
  const dd = toDoubleDigits(date.getDate());
  const hh = toDoubleDigits(date.getHours());
  const mi = toDoubleDigits(date.getMinutes());
  return yyyy + "/" + mm + "/" + dd + " " + hh + ":" + mi;
};

module.exports = { yyyymmddhhmiss };