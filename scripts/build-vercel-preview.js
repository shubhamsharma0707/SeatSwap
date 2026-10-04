const fs = require('node:fs')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')
const outputRoot = path.join(projectRoot, 'vercel-preview')
const authBuild = path.join(projectRoot, 'auth-app', 'dist-preview')

function copyFile(source, destination) {
  fs.mkdirSync(path.dirname(destination), { recursive: true })
  fs.copyFileSync(source, destination)
}

function requireFile(filePath) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    throw new Error(`Required preview build file is missing: ${path.relative(projectRoot, filePath)}`)
  }
}

for (const file of ['index.html', 'dashboard.html', 'js/integration.js', 'auth-app/dist-preview/index.html']) {
  requireFile(path.join(projectRoot, file))
}

fs.rmSync(outputRoot, { recursive: true, force: true })
fs.mkdirSync(outputRoot, { recursive: true })

for (const file of ['index.html', 'dashboard.html']) {
  const sourcePath = path.join(projectRoot, file)
  let html = fs.readFileSync(sourcePath, 'utf8')
  const integrationScript = '<script src="js/integration.js"></script>'
  if (!html.includes(integrationScript)) {
    throw new Error(`${file} must load the SeatSwap integration script before it can be published as a preview`)
  }
  html = html.replace(
    integrationScript,
    '<script src="/js/preview-mode.js"></script>\n  ' + integrationScript,
  )
  fs.mkdirSync(path.dirname(path.join(outputRoot, file)), { recursive: true })
  fs.writeFileSync(path.join(outputRoot, file), html)
}

copyFile(path.join(projectRoot, 'js/integration.js'), path.join(outputRoot, 'js/integration.js'))
copyFile(path.join(projectRoot, 'styles/design-system.css'), path.join(outputRoot, 'styles/design-system.css'))
fs.writeFileSync(
  path.join(outputRoot, 'js/preview-mode.js'),
  'window.SEATSWAP_FRONTEND_PREVIEW = true;\n',
)
fs.cpSync(path.join(authBuild, 'index.html'), path.join(outputRoot, 'auth-app', 'dist', 'index.html'))
fs.cpSync(path.join(authBuild, 'assets'), path.join(outputRoot, 'auth-app', 'dist', 'assets'), { recursive: true })

console.log(`Vercel frontend preview built in ${path.relative(projectRoot, outputRoot)}`)
