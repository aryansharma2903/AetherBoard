const average = (a, b) => (a + b) / 2;

export const getSvgPathFromStroke = (points, close = true) => {
  const len = points.length;

  if (!len) {
    return "";
  }

  const first = points[0];
  let result = `M${first[0].toFixed(3)},${first[1].toFixed(3)}Q`;

  for (let i = 0, max = len - 1; i < max; i++) {
    const a = points[i];
    const b = points[i + 1];
    result += `${a[0].toFixed(3)},${a[1].toFixed(3)} ${average(
      a[0],
      b[0]
    ).toFixed(3)},${average(a[1], b[1]).toFixed(3)} `;
  }

  result += "Z";

  return result;
};
