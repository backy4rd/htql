const { getGroups } = require('./functions');

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

async function scanGroup(options, sessionId) {
  const { semester, year, subjectId, groupId, method } = options;

  let groups = await getGroups(semester, year, subjectId, sessionId);
  if (!isGroupExist(groups, groupId)) {
    throw new Error(`group doesn't exist`);
  }

  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        groups = await getGroups(semester, year, subjectId, sessionId);

        if (isGroupRegistrable(groups, groupId)) {
          clearInterval(interval);
          resolve(true);
        }
      } catch (e) {
        reject(e);
      }
    }, 2000);
  });
}

module.exports = scanGroup;
