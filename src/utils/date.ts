export const getCurrentDate = async () => {
  const date = new Date();
  const utc = date.getTime() + date.getTimezoneOffset() * 60 * 1000;
  const koreaTimeDiff = 9 * 60 * 60 * 1000;
  const koreaNow = new Date(utc + koreaTimeDiff);

  return `${koreaNow.getFullYear()}. ${
    koreaNow.getMonth() + 1
  }. ${koreaNow.getDate()}. ${String(koreaNow.getHours()).padStart(
    2,
    '0',
  )}:${String(koreaNow.getMinutes()).padStart(2, '0')}`;
};
