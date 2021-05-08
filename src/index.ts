#!/usr/bin/env node
import { program } from 'commander'
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
  packageName: { files: ['./package.json'], from: '---replace-package-name---' },
  mongodbName: { files: ['./.env.*'], from: '---replace-mongodb-name---' },
  cluster: { files: k8sFiles, from: '{{replace-cluster}}' },
  stageCluster: { files: k8sFiles, from: '{{replace-stage-cluster}}' },
  appName: { files: k8sFiles, from: '{{replace-app-name}}' },
  namespaceName: { files: k8sFiles, from: '{{replace-namespace-name}}' },
  hostName: { files: k8sFiles, from: '{{replace-host-name}}' },
  pathName: { files: k8sFiles, from: '{{replace-path-name}}' }
}

program
  .option('-p, --package-name <packageName>', '---replace-package-name--- - package.json')
  .option('-m, --mongodb-name <mongodbName>', '---replace-mongodb-name--- - .env.development')
  .option('-c, --cluster <cluster>', '{{replace-cluster}} - k8s cluster name')
  .option('-s, --stage-cluster <stageCluster>', '{{replace-stage-cluster}} - k8s stage cluster name')
  .option('-a, --app-name <appName>', '{{replace-app-name}} - k8s app name')
  .option('-n, --namespace-name <namespaceName>', '{{replace-namespace-name}} - k8s namespace name')
  .option('-h, --host-name <hostName>', '{{replace-host-name}} - k8s ingress host name')
  .option('-t, --path-name <pathName>', '{{replace-path-name}} - k8s ingress path name')

program.action(async (options: IOptions) => {
  const hasAnyOption = Object.keys(options).length > 0
  if (!hasAnyOption) {
    program.help()
  }
  for (const [option, to] of Object.entries(options)) {
    const { files, from } = rules[option]
    try {
      const results = await replace.replaceInFile({
        files,
        from: new RegExp(from, 'g'),
        to,
        allowEmptyPaths: true
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
