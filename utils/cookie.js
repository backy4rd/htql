function parse(cookie) {
  const parsedCookie = {};
  const keyValuePairs = cookie.match(/(?<=(^|, ))\w+=[^; ]+/g);

  keyValuePairs.forEach((keyValuePair) => {
    const [key, value] = keyValuePair.split('=');
    parsedCookie[key] = value;
  });

  return parsedCookie;
}

module.exports.parse = parse;
