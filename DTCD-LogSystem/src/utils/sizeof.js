export default function sizeof(v) {
  let f = sizeof,
    o = {
      undefined: () => 0,
      boolean: () => 4,
      number: () => 8,
      string: i => 2 * i.length,
      object: i => (!i ? 0 : Object.keys(i).reduce((t, k) => f(k) + f(i[k]) + t, 0)),
    };
  return o[typeof v](v);
}
