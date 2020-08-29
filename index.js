#!/usr/bin/node

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const rootCas = require('ssl-root-cas').create();
const readlineSync = require('readline-sync');
const cookie = require('./utils/cookie');
const cli = require('./utils/cli');

rootCas.addFile(path.resolve(__dirname, 'cert', 'htql.pem'));
require('https').globalAgent.options.ca = rootCas;

const groupsPattern = /(?<=class="((main_3)|(level_1_\d))"( style.+)?>).+?(?=<\/td>)/g;

async function loginAndGetSessionId(studentId, password) {
  const response = await fetch(
    'https://qldt.ctu.edu.vn/htql/sinhvien/dang_nhap.php',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
      body: `txtDinhDanh=${studentId}&txtMatKhau=${password}`,
    },
  );

  if (/logout.php/.test(await response.text())) {
    throw new Error('login fail');
  }

  const { PHPSESSID } = cookie.parse(response.headers.get('set-cookie'));

  // grant access to dkmh
  await fetch('https://qldt.ctu.edu.vn/htql/dkmh/student/dang_nhap.php', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      Cookie: `PHPSESSID=${PHPSESSID}`,
    },
    body: `txtDinhDanh=${studentId}&txtMatKhau=p`,
  });

  return PHPSESSID;
}

async function getGroups(semester, year, subjectId, sessionId) {
  const response = await fetch(
    'https://qldt.ctu.edu.vn/htql/dkmh/student/index.php?action=dmuc_mhoc_hky',
    {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        cookie: `PHPSESSID=${sessionId}`,
      },
      body: `cmbHocKy=${semester}&cmbNamHoc=${year}&txtMaMH=${subjectId}`,
    },
  );
  // replace uneccessary text
  const html = (await response.text()).replace(/&nbsp;/g, '');
  const flatData = html.match(groupsPattern);

  if (flatData.length == 0) {
    throw new Error('invalid mahp or hoc phan is not open in this semester');
  }

  const groups = [];
  while (flatData.length) {
    const row = flatData.splice(0, 10);
    groups.push({
      stt: row[0],
      kihieu: row[1],
      thu: row[2],
      tiet: row[3],
      batdau: row[4],
      phong: row[5],
      siso: row[6],
      conlai: row[7],
      tuanhoc: row[8],
      lopHP: row[9],
    });
  }

  return groups.slice(1);
}

function isGroupExist(groups, groupId) {
  return groups.some(lop => lop.kihieu === groupId);
}

function isGroupRegistrable(groups, groupId) {
  for (let i = 0; i < groups.length; i++) {
    const lop = groups[i];
    if (lop.kihieu == groupId) {
      if (lop.conlai != 0) return true;
      return false;
    }
  }
}

function validateParameters({ semester, year, subjectId, groupId, method }) {
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

function parseMethod(method) {
  switch (method) {
    case 'doinhom':
      return 'changegroup';
    case 'dangki':
      return 'regdetails';
  }
}

async function joinGroup(subjectId, groupId, method, sessionId) {
  const response = await fetch(
    'https://qldt.ctu.edu.vn/htql/dkmh/student/index.php?action=dky_mhoc',
    {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        cookie: `PHPSESSID=${sessionId}`,
      },
      body: `txtMaMonHoc=${subjectId}&hidMaNhom=${groupId}&hidMethod=${parseMethod(
        method,
      )}`,
    },
  );

  fs.writeFileSync('./htql.html', await response.text());
}

async function main() {
  const { semester, year, subjectId, groupId, method } = cli.parse(
    process.argv,
  );
  validateParameters({ semester, year, subjectId, groupId, method });

  const studentId = readlineSync.question('MSSV: ');
  const password = readlineSync.question('Mat Khau: ');

  const sessionId = await loginAndGetSessionId(studentId, password);

  console.log('\nLogin success --> Scanning for group');

  let groups = await getGroups(semester, year, subjectId, sessionId);
  if (!isGroupExist(groups, groupId)) {
    throw new Error(`group doesn't exist`);
  }

  const interval = setInterval(async () => {
    groups = await getGroups(semester, year, subjectId, sessionId);

    if (isGroupRegistrable(groups, groupId)) {
      clearInterval(interval);
      await joinGroup(subjectId, groupId, method, sessionId);

      console.log('\nJoined group!!');
      console.log(
        `---> Result can be found in ${path.resolve(__dirname, 'htql.html')}`,
      );
      process.exit(1);
    }
  }, 2000);
}

main();
