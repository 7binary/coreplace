# Replace placeholders of boilerplate

Example: 
```shell
npx replace -p feed.admin -m feed.admin -c feed-admin -s feed-admin-stage -a admin -n feed -h feed.amolatina.com -t /
```

## Templates

```yml
---replace-package-name--- - package.json name
---replace-mongodb-name--- - .env.development local environment
{{replace-cluster}} - k8s cluster name
{{replace-stage-cluster}} - k8s stage-cluster name
{{replace-namespace-name}} - k8s namespace name
{{replace-app-name}} - k8s app name
{{replace-host-name}} - k8s ingress host name
{{replace-path-name}} - k8s ingress path name
```

## Files to replace:

```yml
package.json
  ---replace-package-name---

.env.development
  ---replace-mongodb-name---

automation.yml
  {{replace-cluster}}
  {{replace-stage-cluster}}

0010.deployment.yml
  {{replace-app-name}}
  {{replace-namespace-name}}

0020.service.yml
  {{replace-app-name}}
  {{replace-namespace-name}}

0030.ingress.yml
  {{replace-app-name}}
  {{replace-namespace-name}}
  {{replace-host-name}}
  {{replace-path-name}}
```

## scripts

```json
{
  "start": "ts-node src/index.ts",
  "dev": "ts-node src/index.ts",
  "build": "esbuild src/index.ts --platform=node --outfile=dist/index.js --bundle --minify --define:process.env.NODE_ENV=\\\"production\\\"",
  "prepublishOnly": "yarn build",
  "clean": "del ./dist/*",
  "pub": "yarn clean && yarn publish"
}
```
