function processArgumentName(arg) {
  if (/^--\w+$/.test(arg)) {
    return arg.slice(2);
  }

  if (/^-\w+$/.test(arg)) {
    switch (arg) {
      case '-s':
        return 'semester';
      case '-y':
        return 'year';
      case '-j':
        return 'subjectId';
      case '-g':
        return 'groupId';
      case '-m':
        return 'method';
    }
  }

  throw new Error('invalid arguments');
}

function parseArguments(argv) {
  const args = argv.slice(2);
  const option = {};

  for (let i = 0; i < args.length; i += 2) {
    if (!args[i + 1]) break;

    option[processArgumentName(args[i])] = args[i + 1];
  }

  if (option.groupId) {
    option.groupId = option.groupId.padStart(2, '0');
  }
  return option;
}

module.exports.parse = parseArguments;
