const fs = require('fs');
const path = require('path');
const request = require('request-promise');
const cookie = require('../utils/cookie');

const groupsPattern = /(?<=class="((main_3)|(level_1_\d))"( style.+)?>).+?(?=<\/td>)/g;

async function loginAndGetSessionId(studentId, password) {
  const response = await request.post(
    'https://qldt.ctu.edu.vn/htql/sinhvien/dang_nhap.php',
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
      body: `txtDinhDanh=${studentId}&txtMatKhau=${password}`,
      resolveWithFullResponse: true,
    },
  );

  if (/logout.php/.test(response.body)) {
    throw new Error('login fail');
  }

  const { PHPSESSID } = cookie.parse(response.headers['set-cookie'].join(', '));

  // grant access to dkmh
  await request.post(
    'https://qldt.ctu.edu.vn/htql/dkmh/student/dang_nhap.php',
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        Cookie: `PHPSESSID=${PHPSESSID}`,
      },
      body: `txtDinhDanh=${studentId}&txtMatKhau=p`,
    },
  );

  return PHPSESSID;
}

async function getGroups(semester, year, subjectId, sessionId) {
  const data = await request.post(
    'https://qldt.ctu.edu.vn/htql/dkmh/student/index.php?action=dmuc_mhoc_hky',
    {
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        cookie: `PHPSESSID=${sessionId}`,
      },
      body: `cmbHocKy=${semester}&cmbNamHoc=${year}&txtMaMH=${subjectId}`,
    },
  );
  // remove annoying character
  const html = data.replace(/&nbsp;/g, '');
  const flatData = html.match(groupsPattern);

  if (flatData.length == 0) {
    throw new Error(
      `invalid subjectId or subject isn't opened in this semester`,
    );
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

async function regisGroup(subjectId, groupId, method, sessionId) {
  const data = await request.post(
    'https://qldt.ctu.edu.vn/htql/dkmh/student/index.php?action=dky_mhoc',
    {
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        cookie: `PHPSESSID=${sessionId}`,
      },
      body: `txtMaMonHoc=${subjectId}&hidMaNhom=${groupId}&hidMethod=${method}`,
    },
  );

  fs.writeFileSync('./htql.html', data);
}

module.exports = {
  login: loginAndGetSessionId,
  getGroups: getGroups,
  regisGroup: regisGroup,
};
