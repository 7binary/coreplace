#!/usr/bin/env node
import { Command, program } from 'commander'
import replace from 'replace-in-file'
import chalk from 'chalk'

interface IRule {
  files: string[]
  from: string
}

interface IOptions {
  packageName?: string
  mongodbName?: string
  cluster?: string
  stageCluster?: string
  appName?: string
  namespaceName?: string
}

const k8sFiles = ['./k8s/**/*.yml', './automation.yml']
const rules: { [key: string]: IRule } = {
  packageName: { files: ['./package.json'], from: 'feed.admin' },
  mongodbName: { files: ['./.env.*'], from: '---replace-mongodb-name---' },
  cluster: { files: k8sFiles, from: 'feed' },
  stageCluster: { files: k8sFiles, from: '{{replace-stage-cluster}}' },
  appName: { files: k8sFiles, from: '{{replace-app-name}}' },
  namespaceName: { files: k8sFiles, from: 'feed' },
  hostName: { files: k8sFiles, from: '{{replace-host-name}}' },
  pathName: { files: k8sFiles, from: '{{replace-path-name}}' }
}

program
  .allowUnknownOption()
  .option('-p, --package-name <packageName>', 'feed.admin - package.json')
  .option('-m, --mongodb-name <mongodbName>', '---replace-mongodb-name--- - .env.development')
  .option('-c, --cluster <cluster>', 'feed - k8s cluster name')
  .option('-s, --stage-cluster <stageCluster>', '{{replace-stage-cluster}} - k8s stage cluster name')
  .option('-a, --app-name <appName>', '{{replace-app-name}} - k8s app name')
  .option('-n, --namespace-name <namespaceName>', 'feed - k8s namespace name')
  .option('-h, --host-name <hostName>', '{{replace-host-name}} - k8s ingress host name')
  .option('-t, --path-name <pathName>', '{{replace-path-name}} - k8s ingress path name')

program.action(async (options: IOptions, cmd: Command) => {
  // проверка наличия опций замены - при пустых покажем подсказки
  const hasAnyOption = Object.keys(options).length > 0 || cmd.args.length > 0
  if (!hasAnyOption) {
    program.help()
  }
  const ignore = ['node_modules', '.git', '.idea', '.husky', 'dist', 'build', '.eslintcache', '.npmrc']
    .map(dir => `${dir}/**/*.*`)
    .concat(['README.md', 'package-lock.json', 'yarn.lock'])
  const notReplacedText = chalk.grey('не нашлось файлов для замены')

  // выполнение замен по аргументам запуска: {{replace-something}}=ONE ---replace-anything---=TWO
  for (let i = 0; i < cmd.args.length; i++) {
    const pair = cmd.args[i]
    const [from, to] = pair.split('=')
    if (!from || !to) {
      console.log(`${chalk.redBright('Invalid pair Error')} :: ${chalk.yellowBright(pair)} :: Example: {{replace-key}}=value`)
      continue
    }
    if (!from.startsWith('{{replace-') && !from.startsWith('---replace-')) {
      console.log(`${chalk.redBright('Invalid key Error')} :: ${chalk.yellowBright(pair)} :: Example: {{replace-key}}=value`)
      continue
    }
    try {
      const results = await replace.replaceInFile({
        files: ['**/*.*'],
        ignore,
        allowEmptyPaths: true,
        from: new RegExp(from, 'g'),
        to
      })
      const successFiles = results.filter(r => r.hasChanged).map(r => chalk.greenBright(r.file)).join(' ')
      console.log(`${chalk.yellowBright(from)} => ${chalk.blueBright.bold(to)} :: ${successFiles || notReplacedText}`)
    } catch (err) {
      console.log(`${chalk.yellowBright(from)} => ${chalk.blueBright.bold(to)} :: ${chalk.redBright(err)}`)
    }
  }

  // выполнение замен по опциям запуска: -c feed -p feed.admin
  for (const [option, to] of Object.entries(options)) {
    const { files, from } = rules[option]
    try {
      const results = await replace.replaceInFile({
        files,
        allowEmptyPaths: true,
        from: new RegExp(from, 'g'),
        to
      })
      const successFiles = results.filter(r => r.hasChanged).map(r => chalk.greenBright(r.file)).join(' ')
      const skipFiles = results.filter(r => !r.hasChanged).map(r => chalk.grey(r.file)).join(' ')
      const outputFiles = successFiles === '' ? skipFiles : `${successFiles} ${skipFiles}`
      console.log(`${chalk.yellowBright(from)} => ${chalk.blueBright.bold(to)} :: ${outputFiles}`)
    } catch (err) {
      console.log(`${chalk.yellowBright(from)} => ${chalk.blueBright.bold(to)} :: ${chalk.redBright(err)}`)
    }
  }
})

program.parse(process.argv)
