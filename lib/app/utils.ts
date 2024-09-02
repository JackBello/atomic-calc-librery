export const range = (length: number) => [...Array(length).keys()];

export const numberToChar = (number: number) => {
  let columnName = "";

  while (number >= 0) {
    columnName = String.fromCharCode((number % 26) + 65) + columnName;
    number = Math.floor(number / 26) - 1;
  }

  return columnName;
};
