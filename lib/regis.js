#!/usr/bin/node

const path = require('path');
const fetch = require('node-fetch');
const rootCas = require('ssl-root-cas').create();
const readlineSync = require('readline-sync');
const cookie = require('./utils/cookie');
const cli = require('./utils/cli');
const argumentHandler = require('./utils/argumentHandler');
const { login, getGroups } = require('./functions');

rootCas.addFile(path.resolve(__dirname, 'cert', 'htql.pem'));
require('https').globalAgent.options.ca = rootCas;

function isGroupExist(groups, groupId) {
  return groups.some((group) => group.kihieu === groupId);
}

function isGroupRegistrable(groups, groupId) {
  for (let i = 0; i < groups.length; i++) {
    const lop = groups[i];
    if (lop.kihieu == groupId) {
      if (lop.conlai != 0) return true;
      return false;
    }
  }

  return false;
}

async function isRegistrationAvailable(sessionId) {
  const response = await fetch(
    'https://qldt.ctu.edu.vn/htql/dkmh/student/index.php?action=dky_mhoc',
    {
      headers: { cookie: `PHPSESSID=${sessionId}` },
    },
  );

  return !/Đã hết thời gian đăng ký học phần/.test(await response.text());
}

async function scanGroup(option, sessionId) {
  if (!(await isRegistrationAvailable(sessionId))) {
    throw new Error('not time to register');
  }

  let groups = await getGroups(semester, year, subjectId, sessionId);
  if (!isGroupExist(groups, groupId)) {
    throw new Error(`group doesn't exist`);
  }

  const interval = setInterval(async () => {
    groups = await getGroups(semester, year, subjectId, sessionId);

    if (isGroupRegistrable(groups, groupId)) {
      clearInterval(interval);

      return true;
    }
  }, 2000);
}

module.exports = scanGroup;

// const {
//   semester,
//   year,
//   subjectId,
//   groupId,
//   method,
// } = argumentHandler.process(cli.parse(process.argv));

// const studentId = readlineSync.question('MSSV: ');
// const password = readlineSync.question('Mat Khau: ', { hideEchoBack: true });

// const sessionId = await login(studentId, password);

// console.log('\nLogin success !!!');
