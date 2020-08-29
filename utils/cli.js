function parse(argv) {
  const args = argv.slice(2);
  const option = {};

  for (let i = 0; i < args.length; i += 2) {
    if (!/^--\w+$/.test(args[i])) {
      throw Error('invalid params');
    }

    if (!args[i + 1]) break;

    option[args[i].slice(2)] = args[i + 1];
  }

  if (option.groupId) {
    option.groupId = option.groupId.padStart(2, '0');
  }
  return option;
}

module.exports.parse = parse;
