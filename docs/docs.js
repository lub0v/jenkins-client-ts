const fs = require('fs');
const { execSync } = require('child_process');

function clearReadme() {
  fs.writeFileSync('readme.md', '# API\n\n');
}

function generateReadme(path) {
  execSync(
    `node ../node_modules/documentation/bin/documentation.js readme ../${path} --section=API --github --shallow`,
  );
}

function sortByKeys(arr, sortKeys, key = undefined) {
  arr.sort((a, b) => {
    let indA = key ? sortKeys.indexOf(a[key]) : sortKeys.indexOf(a);
    let indB = key ? sortKeys.indexOf(b[key]) : sortKeys.indexOf(b);
    indA = indA > -1 ? indA : 10000;
    indB = indB > -1 ? indB : 10000;
    return indA > indB ? 1 : -1;
  });
}

function replaceSourceCodeLink(val) {
  return val.replace(new RegExp('blob/(.+?)/src'), 'blob/main/src');
}

const modules = [
  'jobs',
  'builds',
  'queue',
  'views',
  'users',
  'nodes',
  'labels',
  'plugins',
  'credentials',
  'credentials.domains',
];

clearReadme();

generateReadme('src/types.ts');

const typesContent = fs.readFileSync('readme.md').toString();

const types = {};
const typesRegex = new RegExp(
  '[\\r\\n]+## (.+?)[\\r\\n]+.+?\\]\\((.+?"Source code on GitHub")',
  'imgs',
);
typesContent.replace(typesRegex, (m, type, link) => {
  types[type] = link;
  return '';
});

const contents = {};

for (const module of modules) {
  clearReadme();
  const path = module.replace(/\./g, '/');
  generateReadme(`src/${path}/**`);
  contents[module] = fs.readFileSync('readme.md').toString();
}

const data = {};

for (const module of modules) {
  if (!data[module]) {
    data[module] = [];
  }
  const content = contents[module];
  const regex = new RegExp(
    '[\\r\\n]+## (.+?)[\\r\\n]+(.+?)[\\r\\n]+(.+?)### Parameters[\\r\\n](.+?)### Examples[\\r\\n](.+?)[\\r\\n]Returns(.+?)[\\r\\n]',
    'imgs',
  );
  content.replace(regex, (match, name, link, desc, parameters, example, returns) => {
    let n = name.trim();
    if (n.startsWith('delete')) {
      n = 'delete';
    }

    const arr = desc.trim().split('\n');
    const descFirstLine = arr[0].trim();
    const additionalDesc = arr.splice(1).join('\n').trim();

    example = example.replace(
      new RegExp('```javascript[\\r\\n]Example result:\\s+(.+?)\\s+```', 'imgs'),
      '<details><summary>Example result</summary>\n\n```javascript\n$1\n```\n</details>\n',
    );

    for (const [key, value] of Object.entries(types)) {
      if (returns.includes(`<${key}>`)) {
        returns = returns.replace(`<${key}>`, `<[${key}](${value})>`);
      }
    }

    parameters = parameters
      .replace('options*   `', 'options\n\n    *   `')
      .replace('`stop`.*   `stop`', '`stop`.\n\n    *   `stop`');
    for (const [key, value] of Object.entries(types)) {
      if (parameters.includes(`**${key}**`)) {
        parameters = parameters.replace(`**${key}**`, `**[${key}](${value})**`);
      }
      if (parameters.includes(`**${key}?**`)) {
        parameters = parameters.replace(`**${key}?**`, `**[${key}](${value})?**`);
      }
    }

    returns = replaceSourceCodeLink(returns);
    parameters = replaceSourceCodeLink(parameters);
    link = replaceSourceCodeLink(link);
    let displayName = `jenkins.${module}.${n}`;
    if (module === 'credentials') {
      displayName = `jenkins.credentials.<>.${n}`;
    }
    if (module === 'credentials.domains') {
      displayName = `jenkins.credentials.<>.domains.${n}`;
    }
    data[module].push({
      name: n,
      href: displayName.replace(/\./g, '').replace(/<>/g, ''),
      displayName,
      link: link.trim(),
      title: descFirstLine,
      desc: additionalDesc,
      parameters: parameters
        .replace('*   `path` **[string]', '*   [`path`](#path-parameter) **[string]')
        .replace('*   `requests` **JenkinsRequests**', '')
        .replace(
          '*   `store` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)**',
          '',
        )
        .replace(
          '*   `pathOrUser` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)**',
          '',
        )
        .trim(),
      examples: example.trim(),
      returns: returns.trim(),
    });
    return '';
  });

  sortByKeys(
    data[module],
    [
      'build',
      'get',
      'exists',
      'list',
      'create',
      'copy',
      'delete',
      'update',
      'setConfig',
      'configJson',
      'configXml',
      'wait',
      'waitForStart',
      'abort',
      'log',
      'logStream',
      'addJob',
      'removeJob',
      'whoAmI',
      'generateToken',
      'revokeToken',
      'markOffline',
      'bringOnline',
      'disable',
      'enable',
    ],
    'name',
  );
}

clearReadme();

let str = '';
for (const module of modules) {
  const moduleHref = module.replace(/\./g, '-');
  const methods = data[module].map(m => `[\`${m.name}\`](#${m.href})`).join(' ');
  str += `[__${module}__](#${moduleHref}): ${methods}\n\n`;
}

for (const module of modules) {
  const methods = data[module];
  const title = (module.charAt(0).toUpperCase() + module.slice(1)).replace(/\./g, ' ');
  str += `## ${title}\n`;
  for (const method of methods) {
    str += `\n#### \`${method.displayName}\`\n\n`;
    str += `<details><summary>${method.title}</summary>\n\n`;
    if (method.desc) {
      str += `##### Notes\n\n${method.desc}\n\n`;
    }
    if (method.parameters.trim().length) {
      str += `##### Parameters\n\n${method.parameters}\n\n`;
    }
    str += `##### Returns\n\n ${method.returns}\n\n`;
    str += `##### Examples\n\n${method.examples}\n\n`;
    str += `##### Code reference\n\n${method.link}\n\n`;
    str += '</details>\n\n';
  }
}

fs.copyFileSync('before.md', 'readme.md');
fs.appendFileSync('readme.md', str);
