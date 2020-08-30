function validateArguments(_arguments) {
  const { semester, year, subjectId, groupId, method } = _arguments;
  if (!semester || !year || !subjectId || !groupId || !method) {
    throw new Error('missing parameter');
  }

  if (!/^[123]$/.test(semester)) {
    throw new Error('invalid semester');
  }

  if (!/^20\d\d$/.test(year)) {
    throw new Error('invalid year');
  }

  if (!/^[a-zA-Z]{2}\d{3}$/.test(subjectId)) {
    throw new Error('invalid subjectId');
  }

  if (!/^\d{1,2}$/.test(groupId)) {
    throw new Error('invalid groupId');
  }

  if (method !== 'doinhom' && method !== 'dangki') {
    throw new Error('invalid method');
  }
}

function processArguments(_arguments) {
  validateArguments(_arguments);

  return {
    semester: _arguments.semester,
    year: _arguments.year,
    subjectId: _arguments.subjectId,
    groupId: _arguments.groupId.padStart(2, '0'),
    method: _arguments.method === 'doinhom' ? 'changegroup' : 'regdetails',
  };
}

module.exports.process = processArguments;
