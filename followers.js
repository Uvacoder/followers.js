const { readFile, writeFile } = require('fs').promises
const { join } = require('path')
const https = require('https')

const request = (user, token) => new Promise((resolve, reject) => {
  const url = `https://api.github.com/users/${user}/followers?page=1&per_page=100`
  const options = {
    headers: {
      'Authorization': token,
      'User-Agent': 'Get Followers Action'
    }
  }
  https.get(url, options, res => {
    let body = ''

    res.on('data', (chunk) => {
        body += chunk
    });

    res.on('end', () => {
      try {
        const json = JSON.parse(body)
        resolve(json)
      } catch (error) {
        reject(error)
      };
    });
  }).on('error', reject)
})

const createTable = (users, usersPerRow) => {
  const usersHTML = users.map(user => `
  <td align="center">
    <a href="${user.html_url}">
      <img src="${user.avatar_url}" />
      <br />
      ${user.name || user.login}
    </a> 
  </td>`)
  const rows = Array(Math.ceil(users.length / usersPerRow)).fill(0).map((_, i) =>
    `<tr>${usersHTML.slice(i * usersPerRow, (i + 1) * usersPerRow).join('\n')}</tr>`)
  return `\n<table>${rows.join('\n')}</table>\n`
}

const getFollowers = async (user, token, usersPerRow) => {
  const path = join(process.cwd(), './README.md')
  const readme = await readFile(path, 'utf-8')
  const users = await request(user, token)
  const table = createTable(users.reverse(), usersPerRow)
  const regex = /(?<=<!--START_SECTION:top-followers-->)[\s\S]*(?=<!--END_SECTION:top-followers-->)/
  const newReadme = readme.replace(regex, table)
  await writeFile(path, newReadme)
}

const [user, token] = process.argv.slice(-2)
getFollowers(user, token, 6)
.catch(console.error)
